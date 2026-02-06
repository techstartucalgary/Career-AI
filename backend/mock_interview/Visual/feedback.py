
def _state(x, lo, hi):
    if x is None:
        return "unknown"
    if x < lo:
        return "low"
    if x > hi:
        return "high"
    return "ok"

def _msg(label, state, ok, low, high, unknown, too_close=None):
    if state == "too_close" and too_close:
        return f"{label}: {too_close}"
    if state == "ok":
        return f"{label}: {ok}"
    if state == "low":
        return f"{label}: {low}"
    if state == "high":
        return f"{label}: {high}"
    return f"{label}: {unknown}"

def feedback_from_metrics(m):
    ms = m.get("movement_score")
    eye = m.get("eye_contact")
    stare = m.get("stare_streak_sec")
    d = m.get("framing_proxy")
    c = m.get("center_offset")
    ta = m.get("torso_angle")
    ts = m.get("torso_sep")
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
    elif d > 0.45:
        dist_state = "too_close"
    elif d < 0.22:
        dist_state = "low"
    else:
        dist_state = "ok"

    #Camera centering
    if c is None:
        center_state = "unknown"
    elif c > 0.30:
        center_state = "high"   # very off center
        out["tips"].append("Center yourself in the frame.")
    elif c > 0.18:
        center_state = "low"    # slightly off
        out["tips"].append("Shift a bit to the center.")
    else:
        center_state = "ok"

    # upper-body posture (torso angle + collapse)
    if ta is None or ts is None:
        posture_state = "unknown"
    else:
        # tune these after watching a few values:
        # ta ~ 0.00–0.15 upright, >0.25 usually leaning/slouching
        if ta > 0.30 or ts < 0.12:
            posture_state = "high"
            out["tips"].append("Posture: sit taller and keep your upper body upright.")
        elif ta > 0.22 or ts < 0.16:
            posture_state = "low"
            out["tips"].append("Posture: straighten up a bit.")
        else:
            posture_state = "ok"

    out["indicators"]["posture"] = {"value": ta, "state": posture_state}
    out["indicators"]["centered"] = {"value": c, "state": center_state}
    out["indicators"]["distance"] = {"value": d, "state": dist_state}
    out["indicators"]["movement"] = {"value": ms, "state": move_state}
    out["indicators"]["eye_contact"] = {"value": eye, "state": eye_state}
    out["indicators"]["stare"] = {"value": stare, "state": stare_state}
    out["indicators"]["distance"] = {"value": d, "state": dist_state}
    
    msgs = []

    msgs.append(_msg(
        "Movement",
        move_state,
        ok="Looks calm and steady.",
        low="Add a bit more natural hand movement.",
        high="Calm your hands/upper-body movement a bit.",
        unknown="Movement not detected."
    ))

    msgs.append(_msg(
        "Posture",
        posture_state,
        ok="Sitting upright — good posture.",
        low="Straighten up a bit.",
        high="Sit taller and keep your upper body upright.",
        unknown="Posture not detected."
    ))

    msgs.append(_msg(
        "Centering",
        center_state,
        ok="You’re centered in frame.",
        low="Shift slightly toward the center.",
        high="Re-center yourself in the frame.",
        unknown="Centering not detected."
    ))

    msgs.append(_msg(
        "Distance",
        dist_state,
        ok="Distance from camera looks good.",
        low="Move a bit closer to the camera.",
        high="Move a bit farther from the camera.",
        too_close="Back up — you're too close to the camera.",
        unknown="Distance not detected."
    ))

    msgs.append(_msg(
        "Eyes",
        eye_state,
        ok="Eyes forward on the screen.",
        low="Bring your gaze back to the screen.",
        high="",
        unknown="Eyes not detected."
    ))

    out["tips"] = msgs
    return out


