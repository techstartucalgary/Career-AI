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
        }

        self.frames = 0
        self.eye_contact_frames = 0

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
    return off < 0.18

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