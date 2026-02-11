"""
Mock interview posture analysis routes
"""
from typing import Optional
import base64

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from mock_interview.Visual.analysis import MovementAnalyzer
from mock_interview.Visual.feedback import feedback_from_metrics


router = APIRouter(prefix="/api/mock-interview", tags=["Mock Interview"])

_analyzers: dict[str, MovementAnalyzer] = {}


class PostureAnalyzeRequest(BaseModel):
    image_base64: str
    session_id: Optional[str] = None


def _get_analyzer(session_id: Optional[str]) -> MovementAnalyzer:
    key = session_id or "default"
    analyzer = _analyzers.get(key)
    if analyzer is None:
        analyzer = MovementAnalyzer()
        _analyzers[key] = analyzer
    return analyzer


def _decode_image(image_base64: str):
    try:
        if image_base64.startswith("data:"):
            image_base64 = image_base64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image_base64") from exc

    try:
        import numpy as np
        import cv2
    except Exception as exc:
        raise HTTPException(
            status_code=501,
            detail="Posture analysis dependencies are missing (numpy/opencv).",
        ) from exc

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Unable to decode image")
    return frame


@router.post("/analyze")
def analyze_posture(payload: PostureAnalyzeRequest):
    try:
        import cv2
        import mediapipe as mp
    except Exception as exc:
        raise HTTPException(
            status_code=501,
            detail="Posture analysis dependencies are missing (mediapipe/opencv).",
        ) from exc

    if not hasattr(mp, "solutions"):
        raise HTTPException(
            status_code=501,
            detail=(
                "mediapipe is installed but missing the solutions API. "
                "This often happens on unsupported Python versions. "
                "Use Python 3.10 or 3.11 and reinstall mediapipe in the backend environment."
            ),
        )

    frame = _decode_image(payload.image_base64)

    with mp.solutions.holistic.Holistic(
        refine_face_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as holistic:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(rgb)

    h, w = frame.shape[:2]
    analyzer = _get_analyzer(payload.session_id)
    metrics = analyzer.update(results, frame, w, h, is_speaking=None)
    feedback = feedback_from_metrics(metrics)

    return {
        "success": True,
        "feedback": feedback,
        "indicators": feedback.get("indicators", {}),
    }
