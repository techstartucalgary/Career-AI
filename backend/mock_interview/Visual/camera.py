import cv2
import numpy as np
import mediapipe as mp
import time

from analysis import MovementAnalyzer
from feedback import feedback_from_metrics
analyzer = MovementAnalyzer()
metrics_log = []



# Mediapipe Holistic 
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(
    refine_face_landmarks=True,      # full lips, stable
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Used for drawing hands cleanly
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands


# Webcam 
cap = cv2.VideoCapture(0)
cap.set(3, 1280)
cap.set(4, 720)
time.sleep(0.5)

StartDist = None
scale = 0

# Full lips indices (upper + lower + outline)
MOUTH_IDXS = [
    # Outer
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308,
    # Upper inner
    0, 267, 269, 270, 409, 415,
    # Lower inner
    78, 95, 88, 178, 87, 14, 13, 312, 317, 402
]


def draw_hud(img, lines, x=30, y=40, dy=38):
    for i, s in enumerate(lines):
        cv2.putText(img, s, (x, y + i*dy),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255,255,255), 2)


while True:
    ok, frame = cap.read()
    if not ok:
        continue

    h, w, _ = frame.shape

    # Run holistic
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb)

    h, w = frame.shape[:2]
    is_speaking = None  
    metrics = analyzer.update(results, frame, w, h, is_speaking=is_speaking)
   

#MIRROR FOR DISPLAY
    disp = cv2.flip(frame, 1)
    fb = feedback_from_metrics(metrics)
    ind = fb.get("indicators", {})
    metrics_log.append(metrics)
   
        
    # -------------------- POSE --------------------
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_holistic.POSE_CONNECTIONS
        )

        lm = results.pose_landmarks.landmark

        # Move shoulder line upward
        offset = -20
        r = lm[mp_holistic.PoseLandmark.RIGHT_SHOULDER]
        l = lm[mp_holistic.PoseLandmark.LEFT_SHOULDER]
        r_sh = (int(r.x * w), int(r.y * h) + offset)
        l_sh = (int(l.x * w), int(l.y * h) + offset)
        cv2.line(frame, r_sh, l_sh, (0,255,255), 3)

    #FULL MOUTH 
    if results.face_landmarks:
        fl = results.face_landmarks.landmark

        mouth = []
        for idx in MOUTH_IDXS:
            x, y = int(fl[idx].x * w), int(fl[idx].y * h)
            mouth.append((x, y))

        # dots
        for (x, y) in mouth:
            cv2.circle(frame, (x, y), 3, (0, 0, 255), cv2.FILLED)

        # lines
        for i in range(len(mouth)-1):
            cv2.line(frame, mouth[i], mouth[i+1], (0, 0, 255), 2)
        cv2.line(frame, mouth[-1], mouth[0], (0, 0, 255), 2)

    # HANDS WITH MEDIAPIPE, NOT CVZONE
    # right hand
    if results.right_hand_landmarks:
        for i, lm in enumerate(results.right_hand_landmarks.landmark):
            x, y = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (x, y), 4, (255,0,0), cv2.FILLED)

        # skeleton
        for c in mp_hands.HAND_CONNECTIONS:
            start = results.right_hand_landmarks.landmark[c[0]]
            end   = results.right_hand_landmarks.landmark[c[1]]
            x1, y1 = int(start.x*w), int(start.y*h)
            x2, y2 = int(end.x*w), int(end.y*h)
            cv2.line(frame, (x1,y1), (x2,y2), (255,0,0), 2)

    # left hand
    if results.left_hand_landmarks:
        for i, lm in enumerate(results.left_hand_landmarks.landmark):
            x, y = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (x, y), 4, (0,255,0), cv2.FILLED)

        # skeleton
        for c in mp_hands.HAND_CONNECTIONS:
            start = results.left_hand_landmarks.landmark[c[0]]
            end   = results.left_hand_landmarks.landmark[c[1]]
            x1, y1 = int(start.x*w), int(start.y*h)
            x2, y2 = int(end.x*w), int(end.y*h)
            cv2.line(frame, (x1,y1), (x2,y2), (0,255,0), 2)

    lines = [
        f"Movement: {ind.get('movement', {}).get('state', 'unknown')}",
        f"Posture:  {ind.get('posture', {}).get('state', 'unknown')}",
        f"Center:   {ind.get('centered', {}).get('state', 'unknown')}",
        f"Distance: {ind.get('distance', {}).get('state', 'unknown')}",
        f"Eye:      {ind.get('eye_contact', {}).get('state', 'unknown')}",
    ]


    draw_hud(disp, lines, x=30, y=40, dy=34)

    tips = (fb.get("messages") or []) + (fb.get("tips") or [])
    # de-duplicate while preserving order
    seen = set()
    tips = [t for t in tips if not (t in seen or seen.add(t))]

    y0 = disp.shape[0] - 120
    for i, t in enumerate(tips[:4]):
        cv2.putText(disp, t, (30, y0 + i*30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)


    #LABEL HANDS AFTER FLIP
    if results.right_hand_landmarks:
        cv2.putText(disp, "Right Hand",
                    (30, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.2, (255,0,255), 3)

    if results.left_hand_landmarks:
        cv2.putText(disp, "Left Hand",
                    (disp.shape[1]-220, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.2, (255,0,255), 3)

    
    
    cv2.imshow("Holistic Tracking", disp)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()
