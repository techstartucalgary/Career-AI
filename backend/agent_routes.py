"""
Agent control routes — start/stop the autonomous agent loop, get status.
"""
import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel

from dependencies import get_current_user
from agent_loop import run_agent_cycle, start_session, stop_session, get_session


router = APIRouter(prefix="/api/agent", tags=["agent"])


def _get_user_id(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    user_id = get_current_user(token)
    return str(user_id)


class AgentStartRequest(BaseModel):
    max_apps_per_run: int = 5
    min_match_score: float = 0.65
    boards_enabled: list = ["greenhouse", "lever", "ashby"]


@router.post("/start")
async def start_agent(
    body: AgentStartRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
):
    """Start an agent cycle in the background."""
    user_id = _get_user_id(authorization)

    # Check if already running
    session = get_session(user_id)
    if session and session.get("status") == "running":
        raise HTTPException(status_code=409, detail="Agent is already running")

    config = {
        "max_apps_per_run": body.max_apps_per_run,
        "min_match_score": body.min_match_score,
        "boards_enabled": body.boards_enabled,
    }

    # Run the agent cycle in a background task
    async def _run():
        await run_agent_cycle(user_id, config)

    background_tasks.add_task(asyncio.ensure_future, _run())

    return {
        "success": True,
        "data": {"message": "Agent cycle started", "config": config},
    }


@router.post("/stop")
async def stop_agent(authorization: str = Header(None)):
    """Stop the current agent session."""
    user_id = _get_user_id(authorization)

    stopped = stop_session(user_id)
    if not stopped:
        raise HTTPException(status_code=404, detail="No running agent session found")

    return {"success": True, "data": {"message": "Agent stopped"}}


@router.get("/status")
async def agent_status(authorization: str = Header(None)):
    """Get current agent session state and stats."""
    user_id = _get_user_id(authorization)

    session = get_session(user_id)
    if not session:
        return {
            "success": True,
            "data": {
                "status": "idle",
                "session": None,
            },
        }

    return {
        "success": True,
        "data": {
            "status": session.get("status", "idle"),
            "session": session,
        },
    }
