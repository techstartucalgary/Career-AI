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

    out = {"indicators": {}, "tips": []}

    move_state = _state(ms, 0.20, 0.75)
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

    out["indicators"]["movement"] = {"value": ms, "state": move_state}
    out["indicators"]["eye_contact"] = {"value": eye, "state": eye_state}
    out["indicators"]["stare"] = {"value": stare, "state": stare_state}

    out["tips"] = out["tips"][:2]
    return out

