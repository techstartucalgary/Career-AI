"""
Live activity event emitter with in-memory pub/sub for SSE streaming.
"""
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional

from models_activity import ActivityEventType, ActivityEvent

# Per-user subscriber queues: user_id (str) -> list of asyncio.Queue
_subscribers: Dict[str, List[asyncio.Queue]] = {}


class ActivityEmitter:
    """Emits activity events to MongoDB and in-memory subscriber queues."""

    def __init__(self):
        self._db_col = None

    def _get_col(self):
        if self._db_col is None:
            from database import activity_events_col
            self._db_col = activity_events_col
        return self._db_col

    def emit(
        self,
        user_id: str,
        event_type: ActivityEventType,
        title: str = "",
        description: str = "",
        application_id: Optional[str] = None,
        payload: Optional[dict] = None,
        severity: str = "info",
    ) -> None:
        """
        Insert event to activity_events collection AND push to all
        subscriber queues for that user_id. Non-blocking, drops on full queue.
        """
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": user_id,
            "event_type": event_type.value if isinstance(event_type, ActivityEventType) else event_type,
            "application_id": application_id,
            "title": title,
            "description": description,
            "payload": payload or {},
            "severity": severity,
            "created_at": now,
        }

        # Persist to MongoDB
        col = self._get_col()
        if col is not None:
            try:
                col.insert_one(doc.copy())
            except Exception as e:
                print(f"Failed to persist activity event: {e}")

        # Push to in-memory subscribers (non-blocking)
        event_data = {**doc}
        event_data.pop("_id", None)  # remove mongo _id if present
        queues = _subscribers.get(user_id, [])
        for q in queues:
            try:
                q.put_nowait(event_data)
            except asyncio.QueueFull:
                pass  # drop on full queue


def subscribe(user_id: str, maxsize: int = 256) -> asyncio.Queue:
    """Register an SSE listener queue for a user. Returns the queue."""
    q: asyncio.Queue = asyncio.Queue(maxsize=maxsize)
    if user_id not in _subscribers:
        _subscribers[user_id] = []
    _subscribers[user_id].append(q)
    return q


def unsubscribe(user_id: str, queue: asyncio.Queue) -> None:
    """Remove an SSE listener queue for a user."""
    queues = _subscribers.get(user_id, [])
    try:
        queues.remove(queue)
    except ValueError:
        pass
    if not queues:
        _subscribers.pop(user_id, None)


# Singleton emitter instance
emitter = ActivityEmitter()
