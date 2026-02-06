def _state(x, lo, hi):
    if x is None:
        return "unknown"
    if x < lo:
        return "low"
    if x > hi:
        return "high"
    return "ok"


def feedback_from_metrics(m):
    ms = m.get("movement_score")
    eye = m.get("eye_contact")
    stare = m.get("stare_streak_sec")
    d = m.get("distance_proxy")

    out = {"indicators": {}, "tips": []}

    move_state = _state(ms, 0.10, 0.35)
    if move_state == "high":
        out["tips"].append("Calm your hands/upper-body movement a bit.")
    elif move_state == "low":
        out["tips"].append("Add a bit more natural hand movement.")

    eye_state = "ok" if eye is True else "low" if eye is False else "unknown"
    if eye is False:
        out["tips"].append("Look nearer the camera more often.")

    stare_state = _state(stare, 0.0, 6.0)
    if stare is not None and stare > 6.0:
        out["tips"].append("Break eye contact occasionally so it feels natural.")
    
    # distance proxy (shoulder span): bigger = closer
    if d is None:
        dist_state = "unknown"
    elif d > 0.42:
        dist_state = "high"   # too close
        out["tips"].append("Move a bit farther from the camera.")
    elif d < 0.22:
        dist_state = "low"    # too far
        out["tips"].append("Move a bit closer to the camera.")
    else:
        dist_state = "ok"

    out["indicators"]["movement"] = {"value": ms, "state": move_state}
    out["indicators"]["eye_contact"] = {"value": eye, "state": eye_state}
    out["indicators"]["stare"] = {"value": stare, "state": stare_state}
    out["indicators"]["distance"] = {"value": d, "state": dist_state}


    out["tips"] = out["tips"][:2]
    return out

