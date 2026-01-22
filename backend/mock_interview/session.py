import math
import time


# -------------------------
# SEGMENT 1: small helpers
# -------------------------

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
