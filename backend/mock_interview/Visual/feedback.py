
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
    d = m.get("upper_body_proxy")   
    sp = m.get("slouch_proxy")  
    bs = m.get("base_shoulder_span")   
    c = m.get("center_offset")
    ta = m.get("torso_angle")
    ts = m.get("torso_sep")
    ss = m.get("shoulder_span")
    pbs = m.get("posture_bad_sec")
    out = {"indicators": {}, "tips": [], "messages": []}

    move_state = _state(ms, 0.10, 0.35)
    if move_state == "high":
        out["tips"].append("Calm your hands and upper body movement a bit.")
    elif move_state == "low":
        out["tips"].append("Add a bit more natural hand movement.")

    eye_state = "ok" if eye is True else "low" if eye is False else "unknown"
    stare_state = _state(stare, 0.0, 6.0)
    # occasional eye feedback only
    if stare is not None:
        if stare > 6.0:
            out["tips"].append("Break eye contact briefly - glance at the screen so it feels natural.")
        elif eye is False and stare > 2.5:
            out["tips"].append("Look toward the camera occasionally when speaking.")

    # Distance (upper-body framing): bigger = closer
    if d is None:
        dist_state = "unknown"
    elif d > 0.58:
        dist_state = "too_close"   # face/torso too big
    elif d < 0.21:
        dist_state = "low"         # too far (elbows/chest not filling enough)
    else:
        dist_state = "ok"

    if dist_state == "too_close":
            out["tips"].append("Back up slightly, keep shoulders + chest visible.")
    elif dist_state == "low":
            out["tips"].append("Move closer, include shoulders, chest, and face.")

    #Camera centering
    if c is None:
        center_state = "unknown"
    elif c > 0.18:
        center_state = "high"   # very off center
        out["tips"].append("Center yourself in the frame.")
    elif c > 0.08:
        center_state = "low"    # slightly off
        out["tips"].append("Shift a bit to the center.")
    else:
        center_state = "ok"

    # Posture: front-facing strict (detect slouch-back using shoulder span drop)
    if sp is None and (ta is None or ts is None) and ss is None:
        posture_state = "unknown"
    else:
        bad = False
        warn = False

        # slouch-down cue (head drops toward shoulders)
        if sp is not None:
            if sp > -0.10:
                bad = True
            elif sp > -0.14:
                warn = True
        
        if ss is not None and bs is not None:
            ratio = ss / max(1e-6, bs)
            if ratio < 0.82:
                bad = True
            elif ratio < 0.90:
                warn = True

        # hips-based cues if available (optional)
        if ta is not None and ts is not None:
            if ta > 0.28 or ts < 0.14:
                bad = True
            elif ta > 0.20 or ts < 0.17:
                warn = True

        if bad and pbs is not None and pbs > 2.0:
            posture_state = "high"
            out["tips"].append("Posture: sit tall, don't sink back in the chair.")
        elif warn and pbs is not None and pbs > 1.5:
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

    msgs = []

    msgs.append(_msg(
        "Movement",
        move_state,
        ok="Looks calm and steady.",
        low="Add a bit more natural hand movement.",
        high="Calm your hands and upper body movement a bit.",
        unknown="Movement not detected."
    ))

    msgs.append(_msg(
        "Posture",
        posture_state,
        ok="Sitting upright, good posture.",
        low="Straighten up a bit.",
        high="Sit taller and keep your upper body upright.",
        unknown="Posture not detected."
    ))

    msgs.append(_msg(
        "Centering",
        center_state,
        ok="You are centered in frame.",
        low="Shift slightly toward the center.",
        high="Center yourself in the frame.",
        unknown="Centering not detected."
    ))

    msgs.append(_msg(
        "Distance",
        dist_state,
        ok="Distance from camera looks good.",
        low="Move a bit closer to the camera.",
        high="Move a bit farther from the camera.",
        too_close="Back up — you are too close to the camera.",
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

    out["messages"] = msgs
    return out


