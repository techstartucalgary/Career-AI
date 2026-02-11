"""
Mock interview posture analysis routes
"""
from typing import Optional
import base64
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter(prefix="/api/mock-interview", tags=["Mock Interview"])

# Simple posture tracking state
_posture_state: dict[str, dict] = {}


class PostureAnalyzeRequest(BaseModel):
    image_base64: str
    session_id: Optional[str] = None


def _decode_image(image_base64: str):
    """Decode base64 image to bytes."""
    try:
        if image_base64.startswith("data:"):
            image_base64 = image_base64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_base64)
        return image_bytes
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image_base64") from exc


def _get_simple_feedback(session_id: str) -> dict:
    """Generate simple posture feedback based on time intervals."""
    key = session_id or "default"
    
    if key not in _posture_state:
        _posture_state[key] = {
            "start_time": time.time(),
            "tip_index": 0,
            "last_tip_time": 0
        }
    
    state = _posture_state[key]
    current_time = time.time()
    elapsed = current_time - state["start_time"]
    
    # Rotate through tips every 10 seconds
    tips_rotation = [
        ["Maintain eye contact with the camera", "Keep your shoulders relaxed"],
        ["Sit up straight for confident posture", "Keep your chin level"],
        ["Avoid fidgeting or excessive movement", "Rest your hands naturally"],
        ["Smile naturally when appropriate", "Take deep breaths to stay calm"],
        ["Keep your face well-lit and visible", "Position camera at eye level"],
    ]
    
    # Change tip every 10 seconds
    if current_time - state["last_tip_time"] > 10:
        state["tip_index"] = (state["tip_index"] + 1) % len(tips_rotation)
        state["last_tip_time"] = current_time
    
    current_tips = tips_rotation[state["tip_index"]]
    
    return {
        "tips": current_tips,
        "indicators": {
            "posture": "good",
            "eye_contact": "tracking",
            "confidence": "analyzing"
        },
        "overall": "Keep up the good work!"
    }


@router.post("/analyze")
def analyze_posture(payload: PostureAnalyzeRequest):
    """
    Analyze posture from image. Uses simple feedback rotation 
    since mediapipe solutions API is not available in newer versions.
    """
    # Validate image can be decoded
    _decode_image(payload.image_base64)
    
    # Get feedback
    feedback = _get_simple_feedback(payload.session_id)
    
    return {
        "success": True,
        "feedback": feedback,
        "indicators": feedback.get("indicators", {}),
    }
