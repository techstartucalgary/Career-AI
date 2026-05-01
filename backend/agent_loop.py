"""
Autonomous agent loop — chains discovery → matching → tailoring → prepare_application
in a single cycle. ALWAYS stops for user review before any submission.
"""
import traceback
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from database import agent_sessions_col
from models_activity import ActivityEventType
from activity_emitter import emitter


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_config() -> dict:
    return {
        "max_apps_per_run": 5,
        "boards_enabled": ["greenhouse", "lever", "ashby"],
        "min_match_score": 0.65,
    }


def start_session(user_id: str, config: Optional[dict] = None) -> Optional[str]:
    """Create a new agent session document and return its _id."""
    if agent_sessions_col is None:
        return None

    # Stop any running session first
    agent_sessions_col.update_many(
        {"user_id": user_id, "status": {"$in": ["running", "idle"]}},
        {"$set": {"status": "stopped", "stopped_at": _now_iso()}},
    )

    merged_config = _default_config()
    if config:
        merged_config.update(config)

    doc = {
        "user_id": user_id,
        "status": "running",
        "started_at": _now_iso(),
        "stopped_at": None,
        "config": merged_config,
        "stats": {
            "jobs_discovered": 0,
            "jobs_matched": 0,
            "applications_submitted": 0,
            "applications_failed": 0,
        },
    }
    result = agent_sessions_col.insert_one(doc)
    return str(result.inserted_id)


def stop_session(user_id: str) -> bool:
    """Stop the current running session for a user."""
    if agent_sessions_col is None:
        return False

    result = agent_sessions_col.update_one(
        {"user_id": user_id, "status": "running"},
        {"$set": {"status": "stopped", "stopped_at": _now_iso()}},
    )
    return result.modified_count > 0


def get_session(user_id: str) -> Optional[dict]:
    """Get the most recent agent session for a user."""
    if agent_sessions_col is None:
        return None

    session = agent_sessions_col.find_one(
        {"user_id": user_id},
        sort=[("started_at", -1)],
    )
    if session:
        session["_id"] = str(session["_id"])
    return session


async def run_agent_cycle(user_id: str, config: Optional[dict] = None) -> dict:
    """
    Run one full agent cycle:
    1. Emit agent_started
    2. Discover jobs (via existing fetch_matched_jobs)
    3. Score and filter by min_match_score
    4. Save top matches to pipeline
    5. For each match: call prepare_application (which ends at pending_user_review)
    6. STOP — does NOT auto-approve or submit

    Returns summary stats dict.
    """
    from auto_apply_service import (
        fetch_matched_jobs,
        save_to_pipeline,
        get_settings,
    )
    from application_orchestrator import prepare_application

    uid = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
    user_id_str = str(uid)

    merged_config = _default_config()
    if config:
        merged_config.update(config)

    max_apps = merged_config.get("max_apps_per_run", 5)
    min_score = merged_config.get("min_match_score", 0.65)
    # Convert 0-1 range to 0-100 if needed (existing scoring uses 0-100)
    if min_score <= 1.0:
        min_score_pct = int(min_score * 100)
    else:
        min_score_pct = int(min_score)

    # Create session
    session_id = start_session(user_id_str, merged_config)

    stats = {
        "jobs_discovered": 0,
        "jobs_matched": 0,
        "applications_prepared": 0,
        "applications_failed": 0,
        "session_id": session_id,
    }

    # ── 1. Emit agent_started ──────────────────────────────────
    emitter.emit(
        user_id=user_id_str,
        event_type=ActivityEventType.agent_started,
        title="Agent cycle started",
        description=f"Searching for jobs (max {max_apps}, min score {min_score_pct}%)",
    )

    try:
        # ── 2. Discover and score jobs ─────────────────────────
        settings = get_settings(uid)
        # Override match_threshold with agent config
        original_threshold = settings.get("match_threshold", 70)
        from auto_apply_service import update_settings
        update_settings(uid, {"match_threshold": min_score_pct})

        try:
            matches = await fetch_matched_jobs(uid)
        finally:
            # Restore original threshold
            update_settings(uid, {"match_threshold": original_threshold})

        stats["jobs_discovered"] = len(matches)

        emitter.emit(
            user_id=user_id_str,
            event_type=ActivityEventType.jobs_discovered,
            title=f"Found {len(matches)} matching jobs",
            payload={"count": len(matches)},
        )

        if not matches:
            emitter.emit(
                user_id=user_id_str,
                event_type=ActivityEventType.agent_stopped,
                title="Agent cycle complete",
                description="No matching jobs found",
                payload=stats,
            )
            _finalize_session(user_id_str, stats, "stopped")
            return stats

        # ── 3. Emit per-job match events ───────────────────────
        for job in matches[:max_apps]:
            emitter.emit(
                user_id=user_id_str,
                event_type=ActivityEventType.job_matched,
                title=f"Matched: {job.get('title', 'Unknown')}",
                description=f"{job.get('company', '')} — score {job.get('match_score', 0)}%",
                payload={
                    "job_id": job.get("job_id"),
                    "title": job.get("title"),
                    "company": job.get("company"),
                    "match_score": job.get("match_score"),
                    "tier": job.get("tier"),
                },
            )
            stats["jobs_matched"] += 1

        # ── 4. Save to pipeline and prepare applications ───────
        for job in matches[:max_apps]:
            # Save to existing pipeline
            save_to_pipeline(uid, job)

            # Prepare application (ends at pending_user_review)
            try:
                app_id = prepare_application(
                    user_id=user_id_str,
                    job_id=job["job_id"],
                )
                if app_id:
                    stats["applications_prepared"] += 1
                else:
                    stats["applications_failed"] += 1
            except Exception as e:
                stats["applications_failed"] += 1
                print(f"Failed to prepare application for {job.get('job_id')}: {e}")
                traceback.print_exc()

        # ── 5. STOP — hand off to user ─────────────────────────
        emitter.emit(
            user_id=user_id_str,
            event_type=ActivityEventType.agent_stopped,
            title="Agent cycle complete",
            description=(
                f"Prepared {stats['applications_prepared']} applications for your review. "
                f"Please review and approve each one before submission."
            ),
            payload=stats,
            severity="success",
        )

    except Exception as e:
        traceback.print_exc()
        stats["error"] = str(e)[:200]
        emitter.emit(
            user_id=user_id_str,
            event_type=ActivityEventType.agent_stopped,
            title="Agent cycle failed",
            description=str(e)[:200],
            payload=stats,
            severity="error",
        )

    _finalize_session(user_id_str, stats, "stopped")
    return stats


def _finalize_session(user_id: str, stats: dict, status: str):
    """Update the agent session with final stats."""
    if agent_sessions_col is None:
        return

    agent_sessions_col.update_one(
        {"user_id": user_id, "status": "running"},
        {
            "$set": {
                "status": status,
                "stopped_at": _now_iso(),
                "stats": {
                    "jobs_discovered": stats.get("jobs_discovered", 0),
                    "jobs_matched": stats.get("jobs_matched", 0),
                    "applications_submitted": stats.get("applications_prepared", 0),
                    "applications_failed": stats.get("applications_failed", 0),
                },
            }
        },
    )
