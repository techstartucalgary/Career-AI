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
    Call update() each frame.

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
        }

        self.ema = {
            "mouth_open": EMA(0.35),
            "shoulder_slope": EMA(0.25),
            "gesture_energy": EMA(0.25),
            "fidget": EMA(0.25),
            "hand_fidget": EMA(0.25),
            "lean": EMA(0.25),
            "lighting": EMA(0.25),
        }

        self.frames = 0
        self.eye_contact_frames = 0

        self.speak_frames = 0
        self.speak_eye_frames = 0

        self.listen_frames = 0
        self.listen_eye_frames = 0

        self.left_hand_frames = 0
        self.right_hand_frames = 0

        self.open_palm_frames = 0
        self.hand_frames = 0

        self.stare_streak_sec = 0.0

        self.nod_count = 0
        self.nod_window_start = time.time()
        self._nod_last_sign = None
        self._nod_last_peak_t = 0.0

