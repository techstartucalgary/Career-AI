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

        }

        self.frames = 0
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


# SEGMENT 4: core feature extractors

    def _shoulders(self, results):
        # PoseLandmark indices: LEFT_SHOULDER=11, RIGHT_SHOULDER=12
        l = self._pose_xy(results, 11)
        r = self._pose_xy(results, 12)
        if not l or not r:
            return None
        return l, r

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


    def update(self, results, frame_bgr, frame_w, frame_h, is_speaking=None, now=None):
        t = time.time() if now is None else now
        self.frames += 1

        nose = self._nose(results)

        left_wrist = self._pose_xy(results, 15)
        right_wrist = self._pose_xy(results, 16)

        mouth_open = self._mouth_opening(results)
        pupil_l = self._iris_center(results, "l")
        pupil_r = self._iris_center(results, "r")
        slope = self._shoulder_slope(results)
        slope = self.ema["shoulder_slope"].update(slope)

        slouch = self._slouch_proxy(results)
        slouch = self.ema["lean"].update(slouch)

        dist_proxy = self._distance_proxy(results)
        dist_proxy = self.ema["distance"].update(dist_proxy)

        slope = self._shoulder_slope(results)
        slope = self.ema["shoulder_slope"].update(slope)

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

        dist_proxy = self._distance_proxy(results)
        dist_proxy = self.ema["lean"].update(dist_proxy)  # reuse an EMA or add a new one

        sh = self._shoulders(results)
        span = abs(sh[0][0] - sh[1][0]) if sh else None

        energy = self._gesture_energy(t, left_wrist, right_wrist)
        energy = self.ema["gesture_energy"].update(energy)
        
        if energy is not None and span and span > 1e-6:
            energy = energy / span

        fidget = self._fidget_score(t, nose)
        fidget = self.ema["fidget"].update(fidget)

        if energy is not None and energy < 0.12:
            energy = 0.0
        if fidget is not None and fidget < 0.08:
            fidget = 0.0

        # normalize 
        e = clamp(energy or 0.0, 0.0, 1.5) / 1.5
        f = clamp(fidget or 0.0, 0.0, 1.5) / 1.5

        movement_score = 0.75 * e + 0.25 * f

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
            "distance_proxy": dist_proxy,
            "shoulder_span": span,
            "pupil_l": pupil_l,
            "pupil_r": pupil_r,
            "distance_proxy": dist_proxy,
            "shoulder_slope": slope,
            "slouch_proxy": slouch,

        }
    
