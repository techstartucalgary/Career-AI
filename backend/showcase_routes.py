"""
Showcase mode routes — start/stop demo cycles, check status.
"""
import asyncio

from fastapi import APIRouter, HTTPException, Header

from dependencies import get_current_user
from showcase_service import (
    SHOWCASE_MODE_ENABLED,
    warmup,
    run_showcase_cycle,
    end_cycle,
    _active_cycles,
    check_profile_readiness,
)

router = APIRouter(prefix="/api/showcase", tags=["showcase"])


def _get_user_id(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    user_id = get_current_user(token)
    return str(user_id)


def _require_showcase():
    if not SHOWCASE_MODE_ENABLED:
        raise HTTPException(
            status_code=403,
            detail="Showcase mode is not enabled. Set SHOWCASE_MODE_ENABLED=true.",
        )


@router.get("/status")
async def showcase_status(authorization: str = Header(None)):
    """Return whether showcase mode is enabled and current cycle state."""
    user_id = _get_user_id(authorization)
    cycle = _active_cycles.get(user_id, {})
    return {
        "enabled": SHOWCASE_MODE_ENABLED,
        "cycle_status": cycle.get("status", "idle"),
        "started_at": cycle.get("started_at"),
    }


@router.post("/warmup")
async def showcase_warmup(authorization: str = Header(None)):
    """Pre-warm Playwright, pre-fetch Greenhouse boards, load profile."""
    _require_showcase()
    user_id = _get_user_id(authorization)
    result = await warmup(user_id)
    return result


@router.post("/run-cycle")
async def showcase_run_cycle(
    authorization: str = Header(None),
):
    """Start a showcase cycle in the background."""
    _require_showcase()
    user_id = _get_user_id(authorization)

    cycle = _active_cycles.get(user_id, {})
    if cycle.get("status") in ("running", "holding"):
        raise HTTPException(status_code=409, detail="Showcase cycle already running")

    asyncio.create_task(run_showcase_cycle(user_id))

    return {"success": True, "message": "Showcase cycle started"}


@router.get("/check-profile")
async def showcase_check_profile(authorization: str = Header(None)):
    """Return profile readiness score and missing fields."""
    _require_showcase()
    user_id = _get_user_id(authorization)
    return check_profile_readiness(user_id)


@router.post("/end-cycle")
async def showcase_end_cycle(authorization: str = Header(None)):
    """Close browser and reset state."""
    _require_showcase()
    user_id = _get_user_id(authorization)
    result = await end_cycle(user_id)
    return result
