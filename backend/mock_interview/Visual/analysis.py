import math
import time

# SEGMENT 1: small helpers

def clamp(x, a, b):
    return a if x < a else b if x > b else x


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def lerp(a, b, t):
    return a + (b - a) * t


class EMA:
    def __init__(self, alpha=0.25):
        self.alpha = alpha
        self.v = None

    def update(self, x):
        if x is None:
            if self.v is None:
                return None
            self.v = lerp(self.v, 0.0, self.alpha)  # decay toward calm
            return self.v
        if self.v is None:
            self.v = x
        else:
            self.v = lerp(self.v, x, self.alpha)
        return self.v

    
    
# SEGMENT 2: analyzer class

class MovementAnalyzer:
    """
    metrics = analyzer.update(
        results=holistic_results,
        frame_bgr=frame,
        frame_w=w,
        frame_h=h,
        is_speaking=True/False/None
    )
    """

    def __init__(self):
        self.t_prev = None

        self.prev = {
            "nose": None,
            "left_wrist": None,
            "right_wrist": None,
            "nose_y": None,
            "nose_vy": None,
            "pupil_l": None,
            "pupil_r": None,
            "gaze_state": None,
            "stare_t": 0.0,
        }

        self.ema = {
            "mouth_open": EMA(0.35),
            "shoulder_slope": EMA(0.25),
            "gesture_energy": EMA(0.25),
            "fidget": EMA(0.25),
            "hand_fidget": EMA(0.25),
            "lean": EMA(0.25),
            "lighting": EMA(0.25),
            "eye_move_rate": EMA(0.25),
            "eye_jitter": EMA(0.25),
            "smile": EMA(0.25),
            "neg_expr": EMA(0.25),
            "slouch": EMA(0.25),
            "distance": EMA(0.25),
            "center": EMA(0.25),
            "torso_ang": EMA(0.25),
            "torso_sep": EMA(0.25),
            "framing": EMA(0.25),
        }

        self.movement_bad_sec = 0.0

        self.frames = 0
        self.base_span = None
        self.posture_bad_sec = 0.0

        self.eye_contact_frames = 0
        self.eye_ok_run = 0


        self.speak_frames = 0
        self.speak_eye_frames = 0

        self.listen_frames = 0
        self.listen_eye_frames = 0

        self.left_hand_frames = 0
        self.right_hand_frames = 0

        self.hand_frames = 0
        self.open_palm_frames = 0

        self.stare_streak_sec = 0.0
        self.reading_streak_sec = 0.0
        

        self.nod_count = 0
        self.nod_window_start = time.time()
        self._nod_last_sign = None
        self._nod_last_peak_t = 0.0

# SEGMENT 3: landmark read utilities

    def _pose_xy(self, results, idx):
        if not results or not results.pose_landmarks:
            return None
        lm = results.pose_landmarks.landmark[idx]
        return (lm.x, lm.y)

    def _pose_z(self, results, idx):
        if not results or not results.pose_landmarks:
            return None
        return results.pose_landmarks.landmark[idx].z

    def _face_xy(self, results, idx):
        if not results or not results.face_landmarks:
            return None
        lm = results.face_landmarks.landmark[idx]
        return (lm.x, lm.y)

    def _hand_lm(self, hand_landmarks, idx):
        if not hand_landmarks:
            return None
        lm = hand_landmarks.landmark[idx]
        return (lm.x, lm.y, getattr(lm, "z", 0.0))

    def _framing_proxy(self, results):
        sh = self._shoulders(results)
        hp = self._hips(results)
        if not sh or not hp:
            return None

        sl, sr = sh
        hl, hr = hp

        sy = (sl[1] + sr[1]) / 2.0
        hy = (hl[1] + hr[1]) / 2.0

        # bigger torso height on screen = closer
        torso_h = abs(hy - sy)
        return torso_h

# SEGMENT 4: core feature extractors

    def _shoulders(self, results):
        # PoseLandmark indices: LEFT_SHOULDER=11, RIGHT_SHOULDER=12
        l = self._pose_xy(results, 11)
        r = self._pose_xy(results, 12)
        if not l or not r:
            return None
        return l, r
    

    def _hips(self, results):
        l = self._pose_xy(results, 23)
        r = self._pose_xy(results, 24)
        if not l or not r:
            return None
        return l, r

    def _torso_posture(self, results):
        sh = self._shoulders(results)
        hp = self._hips(results)
        if not sh or not hp:
            return None

        sl, sr = sh
        hl, hr = hp

        sx = (sl[0] + sr[0]) / 2.0
        sy = (sl[1] + sr[1]) / 2.0
        hx = (hl[0] + hr[0]) / 2.0
        hy = (hl[1] + hr[1]) / 2.0

        vx = sx - hx
        vy = sy - hy

        # angle from vertical (0 = upright). bigger = more leaning/slouching
        ang = abs(math.atan2(vx, -vy))  # radians
        # separation (bigger = upright/open, smaller = collapsed)
        sep = abs(hy - sy)

        return ang, sep


    def _distance_proxy(self, results):
        sh = self._shoulders(results)
        if not sh:
            return None
        l, r = sh
        return abs(l[0] - r[0])  # bigger = closer

    def _nose(self, results):
        # PoseLandmark.NOSE = 0
        return self._pose_xy(results, 0)

    def _mouth_opening(self, results):
        # Face mesh: 13/14 is a stable lip center pair
        top = self._face_xy(results, 13)
        bot = self._face_xy(results, 14)
        if not top or not bot:
            return None
        return dist(top, bot)
    
    def _center_offset(self, results):
        nose = self._nose(results)
        sh = self._shoulders(results)
        if not nose or not sh:
            return None
        l, r = sh
        mid_x = (l[0] + r[0]) / 2.0
        span = abs(l[0] - r[0])
        if span < 1e-6:
            return None
        return abs(nose[0] - mid_x) / span  # 0 = perfectly centered


    def _eye_contact_proxy(self, results):
        # nose centered between shoulders
        sh = self._shoulders(results)
        nose = self._nose(results)
        if not sh or not nose:
            return None

        l, r = sh
        mid_x = (l[0] + r[0]) / 2.0
        span = abs(l[0] - r[0])
        if span < 1e-6:
            return None

        off = abs(nose[0] - mid_x) / span
        return off < 0.12

    def _iris_center(self, results, side="l"):
        if not results or not results.face_landmarks:
            return None
        lm = results.face_landmarks.landmark
        # FaceMesh iris landmark indices
        idxs = [468, 469, 470, 471] if side == "l" else [473, 474, 475, 476]
        xs = [lm[i].x for i in idxs]
        ys = [lm[i].y for i in idxs]
        return (sum(xs) / len(xs), sum(ys) / len(ys))

    def _gesture_energy(self, t, left_wrist, right_wrist):
        if self.t_prev is None:
            return None

        dt = max(1e-3, t - self.t_prev)
        total = 0.0
        used = False

        for key, p in [("left_wrist", left_wrist), ("right_wrist", right_wrist)]:
            prev = self.prev.get(key)
            if p and prev:
                total += dist(p, prev) / dt
                used = True

        return total if used else None
    
    def _fidget_score(self, t, nose):
        if self.t_prev is None:
            return None
        dt = max(1e-3, t - self.t_prev)
        prev = self.prev.get("nose")
        if not nose or not prev:
            return None
        return dist(nose, prev) / dt
    
    def _shoulder_slope(self, results):
        sh = self._shoulders(results)
        if not sh:
            return None
        l, r = sh
        return (l[1] - r[1])  # + means left shoulder lower than right

    def _slouch_proxy(self, results):
        sh = self._shoulders(results)
        nose = self._nose(results)
        if not sh or not nose:
            return None
        l, r = sh
        mid_y = (l[1] + r[1]) / 2.0
        return nose[1] - mid_y  # bigger = nose lower relative to shoulders (slouch/lean down)
    
    def _upper_body_proxy(self, results):
        sh = self._shoulders(results)
        if not sh or not results or not results.pose_landmarks:
            return None

        sl, sr = sh
        sy = (sl[1] + sr[1]) / 2.0

        el_l = self._pose_xy(results, 13)  # left elbow
        el_r = self._pose_xy(results, 14)  # right elbow
        if not el_l or not el_r:
            return None

        ey = (el_l[1] + el_r[1]) / 2.0
        return abs(ey - sy)  # bigger = closer (more of upper body fills frame)



    def update(self, results, frame_bgr, frame_w, frame_h, is_speaking=None, now=None):
        t = time.time() if now is None else now
        self.frames += 1

        nose = self._nose(results)

        upper_body = self._upper_body_proxy(results)
        upper_body = self.ema["distance"].update(upper_body)

        left_wrist = self._pose_xy(results, 15)
        right_wrist = self._pose_xy(results, 16)

        mouth_open = self._mouth_opening(results)
        pupil_l = self._iris_center(results, "l")
        pupil_r = self._iris_center(results, "r")
        slope = self._shoulder_slope(results)
        slope = self.ema["shoulder_slope"].update(slope)

        framing = self._framing_proxy(results)
        framing = self.ema["framing"].update(framing)

        center_off = self._center_offset(results)
        center_off = self.ema["center"].update(center_off)

        slouch = self._slouch_proxy(results)
        slouch = self.ema["slouch"].update(slouch)

        mouth_open = self.ema["mouth_open"].update(mouth_open)

        eye_contact = self._eye_contact_proxy(results)

        if eye_contact is True:
            self.eye_ok_run += 1
        elif eye_contact is False:
            self.eye_ok_run = 0

        if eye_contact is not None:
            eye_contact = True if self.eye_ok_run >= 3 else False

        if eye_contact is True:
            self.eye_contact_frames += 1

        if is_speaking is True:
            self.speak_frames += 1
            if eye_contact is True:
                self.speak_eye_frames += 1
        elif is_speaking is False:
            self.listen_frames += 1
            if eye_contact is True:
                self.listen_eye_frames += 1

        eye_speaking_ratio = self.speak_eye_frames / max(1, self.speak_frames) if self.speak_frames else None
        eye_listening_ratio = self.listen_eye_frames / max(1, self.listen_frames) if self.listen_frames else None

        if self.t_prev is None:
            self.stare_streak_sec = 0.0
        else:
            dt = max(1e-3, t - self.t_prev)
            if eye_contact is True:
                self.stare_streak_sec += dt
            else:
                self.stare_streak_sec = 0.0

        sh = self._shoulders(results)
        span = abs(sh[0][0] - sh[1][0]) if sh else None

        if span is not None:
            if self.base_span is None:
                self.base_span = span
            else:
                if span > self.base_span:
                    self.base_span = 0.98*self.base_span + 0.02*span

        energy = self._gesture_energy(t, left_wrist, right_wrist)
        energy = self.ema["gesture_energy"].update(energy)
        
        if energy is not None and span and span > 1e-6:
            energy = energy / span

        # posture timer with hysteresis + decay
        dt = 0.0 if self.t_prev is None else max(1e-3, t - self.t_prev)

        if self.base_span is not None and span is not None:
            ratio = span / max(1e-6, self.base_span)

            # enter "bad posture" if ratio drops low enough
            if ratio < 0.90:
                self.posture_bad_sec += dt

            # clear faster once you're clearly back to good
            elif ratio > 0.93:
                self.posture_bad_sec = max(0.0, self.posture_bad_sec - 2.5*dt)

            # middle zone: slow decay
            else:
                self.posture_bad_sec = max(0.0, self.posture_bad_sec - 1.0*dt)
        else:
            self.posture_bad_sec = 0.0

        fidget = self._fidget_score(t, nose)
        fidget = self.ema["fidget"].update(fidget)

        if energy is not None and energy < 0.12:
            energy = 0.0
        if fidget is not None and fidget < 0.08:
            fidget = 0.0

        torso = self._torso_posture(results)
        if torso:
            torso_ang, torso_sep = torso
        else:
            torso_ang, torso_sep = None, None

        torso_ang = self.ema["torso_ang"].update(torso_ang)
        torso_sep = self.ema["torso_sep"].update(torso_sep)

        # normalize 
        e = clamp(energy or 0.0, 0.0, 1.5) / 1.5
        f = clamp(fidget or 0.0, 0.0, 1.5) / 1.5

        movement_score = 0.75 * e + 0.25 * f
        dt = 0.0 if self.t_prev is None else max(1e-3, t - self.t_prev)

        if movement_score > 0.60:
            self.movement_bad_sec += dt
        elif movement_score < 0.45:
            self.movement_bad_sec = max(0.0, self.movement_bad_sec - 2.0*dt)
        else:
            self.movement_bad_sec = max(0.0, self.movement_bad_sec - 0.7*dt)

        self.prev["nose"] = nose
        self.prev["left_wrist"] = left_wrist
        self.prev["right_wrist"] = right_wrist
        self.t_prev = t

        if self.frames % 30 == 0:
            print({
                "energy": energy,
                "fidget": fidget,
                "movement": movement_score,
                "eye_contact": eye_contact,
                "stare_sec": self.stare_streak_sec,
            })

        if self.frames % 30 == 0:
            print("torso_angle", torso_ang, "torso_sep", torso_sep)

        return {
            "has_pose": bool(results and results.pose_landmarks),
            "has_face": bool(results and results.face_landmarks),
            "mouth_open": mouth_open,
            "eye_contact": eye_contact,
            "eye_contact_speaking_ratio": eye_speaking_ratio,
            "eye_contact_listening_ratio": eye_listening_ratio,
            "stare_streak_sec": self.stare_streak_sec,
            "gesture_energy": energy,
            "fidget": fidget,
            "movement_score": movement_score,
            "shoulder_span": span,
            "base_shoulder_span": self.base_span,
            "pupil_l": pupil_l,
            "pupil_r": pupil_r,
            "shoulder_slope": slope,
            "slouch_proxy": slouch,
            "center_offset": center_off,
            "torso_angle": torso_ang,
            "torso_sep": torso_sep,
            "framing_proxy": framing,
            "upper_body_proxy": upper_body,
            "slouch": slouch,
            "posture_bad_sec": self.posture_bad_sec,
            "movement_bad_sec": self.movement_bad_sec,
        }
    
