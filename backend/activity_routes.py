"""
Activity stream routes — SSE endpoint for live events + recent events for hydration.
"""
import asyncio
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import StreamingResponse

from database import activity_events_col
from dependencies import get_current_user
from activity_emitter import subscribe, unsubscribe


router = APIRouter(prefix="/api/activity", tags=["activity"])

SSE_HEARTBEAT_INTERVAL = 5  # seconds — frequent keep-alive to force flush


def _get_user_id(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    user_id = get_current_user(token)
    return str(user_id)


def _resolve_user_id(authorization: str = None, token: str = None) -> str:
    """Resolve user_id from Bearer header or ?token= query param (for EventSource)."""
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split(" ", 1)[1]
    elif token:
        auth_token = token
    if not auth_token:
        raise HTTPException(status_code=401, detail="Missing auth token")
    user_id = get_current_user(auth_token)
    return str(user_id)


@router.get("/stream")
async def activity_stream(
    authorization: str = Header(None),
    token: str = Query(None),
):
    """
    Server-Sent Events stream for the authenticated user.
    Accepts auth via Authorization header OR ?token= query param (for EventSource).
    Sends a keep-alive comment every 5s to force flush.
    """
    user_id = _resolve_user_id(authorization, token)

    async def event_generator():
        queue = subscribe(user_id)
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=SSE_HEARTBEAT_INTERVAL)
                    event.pop("_id", None)
                    yield f"data: {json.dumps(event, default=str)}\n\n"
                except asyncio.TimeoutError:
                    # Comment line — EventSource ignores these, forces HTTP flush
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            unsubscribe(user_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/recent")
async def recent_events(
    authorization: str = Header(None),
    limit: int = Query(50, ge=1, le=200),
    application_id: Optional[str] = Query(None),
):
    """
    Get recent activity events for the user.
    Used for initial UI hydration before the SSE connection is established.
    """
    user_id = _get_user_id(authorization)

    if activity_events_col is None:
        return {"success": True, "data": {"events": []}}

    query = {"user_id": user_id}
    if application_id:
        query["application_id"] = application_id

    docs = list(
        activity_events_col.find(query)
        .sort("created_at", -1)
        .limit(limit)
    )

    events = []
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        events.append(doc)

    # Return in chronological order (oldest first)
    events.reverse()

    return {"success": True, "data": {"events": events}}
