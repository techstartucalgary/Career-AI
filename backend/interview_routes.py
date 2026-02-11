"""
Interview routes - AI Interviewer (Interview Orb) endpoints
"""
from datetime import datetime
from pathlib import Path
from typing import Optional
import base64
import uuid
import io
import wave
import sys
import tempfile
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

try:
    from interview_orb.conversation import InterviewConversation
    from interview_orb.models import InterviewConfig, InterviewSession, InterviewStatus, MessageRole
    from interview_orb import config as orb_config
    _ORB_IMPORT_ERROR = None
except Exception as exc:
    InterviewConversation = None
    InterviewConfig = None
    InterviewSession = None
    InterviewStatus = None
    MessageRole = None
    orb_config = None
    _ORB_IMPORT_ERROR = str(exc)

try:
    from interview_orb.audio.text_to_speech import TextToSpeech
except Exception:
    TextToSpeech = None


router = APIRouter(prefix="/api/interview", tags=["Interview Orb"])

_sessions: dict[str, dict] = {}


def _load_default_text(filename: str) -> str:
    base = Path(__file__).resolve().parent.parent / "interview_orb"
    path = base / filename
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _get_tts():
    if TextToSpeech is None:
        return None
    try:
        return TextToSpeech()
    except Exception:
        return None


_TTS = _get_tts()


def _wrap_wav(raw_pcm: bytes, sample_rate: int = 24000) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(raw_pcm)
    return buffer.getvalue()


def _tts_audio_base64(text: str) -> Optional[str]:
    """
    Generate TTS audio with fallback to REST API if service client fails.
    """
    # Try method 1: Use TextToSpeech client from interview_orb
    if _TTS:
        try:
            raw_audio = _TTS.synthesize(text)
            wav_audio = _wrap_wav(raw_audio)
            return base64.b64encode(wav_audio).decode("utf-8")
        except Exception as e:
            print(f"TextToSpeech client failed: {str(e)}, trying REST API...")
    
    # Try method 2: Use Google Cloud TTS REST API
    google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if google_api_key:
        try:
            import requests
            url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={google_api_key}"
            
            payload = {
                "input": {"text": text},
                "voice": {
                    "languageCode": "en-US",
                    "name": "en-US-Neural2-C"
                },
                "audioConfig": {
                    "audioEncoding": "LINEAR16",
                    "sampleRateHertz": 24000
                }
            }
            
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                result = response.json()
                audio_content = result.get("audioContent", "")
                if audio_content:
                    return audio_content
            else:
                error_msg = response.json().get('error', {}).get('message', 'Unknown error')
                print(f"TTS REST API error: {error_msg}")
        except Exception as e:
            print(f"TTS REST API failed: {str(e)}")
    
    return None


class StartInterviewRequest(BaseModel):
    job_description: Optional[str] = None
    resume: Optional[str] = None
    additional_topics: Optional[str] = None
    max_questions: Optional[int] = None


class InterviewResponse(BaseModel):
    session_id: str
    interviewer_text: str
    audio_base64: Optional[str] = None
    status: str
    question_count: int
    tts_available: bool
    max_questions: int


class RespondInterviewRequest(BaseModel):
    session_id: str
    candidate_text: str
    end_interview: Optional[bool] = False


@router.post("/start", response_model=InterviewResponse)
def start_interview(payload: StartInterviewRequest):
    if InterviewConversation is None or InterviewConfig is None:
        raise HTTPException(status_code=501, detail=f"Interview Orb dependencies are missing: {_ORB_IMPORT_ERROR}")
    job_description = (payload.job_description or _load_default_text("job.txt")).strip()
    resume = (payload.resume or _load_default_text("resume.txt")).strip()
    additional_topics = (payload.additional_topics or "").strip()
    max_questions = payload.max_questions or orb_config.MAX_QUESTIONS

    if not job_description or not resume:
        raise HTTPException(status_code=400, detail="Missing job_description or resume")

    interview_config = InterviewConfig(
        job_description=job_description,
        resume=resume,
        additional_topics=additional_topics,
        max_questions=max_questions,
    )

    session = InterviewSession(config=interview_config)
    session.status = InterviewStatus.IN_PROGRESS
    session.started_at = datetime.now()

    conversation = InterviewConversation(
        job_description=job_description,
        resume=resume,
        additional_topics=additional_topics,
    )

    opening = conversation.start_interview()
    session.add_message(MessageRole.INTERVIEWER, opening)

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "session": session,
        "conversation": conversation,
    }

    audio_base64 = _tts_audio_base64(opening)

    return InterviewResponse(
        session_id=session_id,
        interviewer_text=opening,
        audio_base64=audio_base64,
        status=session.status.value,
        question_count=session.question_count,
        tts_available=audio_base64 is not None,
        max_questions=session.config.max_questions,
    )


def _should_exit(text: str) -> bool:
    if not orb_config:
        return False
    lower = text.lower()
    return any(phrase in lower for phrase in orb_config.EXIT_PHRASES)


@router.post("/respond", response_model=InterviewResponse)
def respond_interview(payload: RespondInterviewRequest):
    if InterviewConversation is None or InterviewSession is None:
        raise HTTPException(status_code=501, detail=f"Interview Orb dependencies are missing: {_ORB_IMPORT_ERROR}")
    entry = _sessions.get(payload.session_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Session not found")

    session: InterviewSession = entry["session"]
    conversation: InterviewConversation = entry["conversation"]

    candidate_text = (payload.candidate_text or "").strip()
    if not candidate_text:
        raise HTTPException(status_code=400, detail="candidate_text is required")

    session.add_message(MessageRole.CANDIDATE, candidate_text)

    if payload.end_interview or _should_exit(candidate_text):
        response_text = conversation.wrap_up()
        session.status = InterviewStatus.COMPLETED
        session.ended_at = datetime.now()
    else:
        session.question_count += 1
        if session.question_count >= session.config.max_questions:
            response_text = conversation.prompt_wrap_up(candidate_text)
            session.status = InterviewStatus.WRAPPING_UP
        else:
            response_text = conversation.respond(candidate_text)

    session.add_message(MessageRole.INTERVIEWER, response_text)

    audio_base64 = _tts_audio_base64(response_text)

    return InterviewResponse(
        session_id=payload.session_id,
        interviewer_text=response_text,
        audio_base64=audio_base64,
        status=session.status.value,
        question_count=session.question_count,
        tts_available=audio_base64 is not None,
        max_questions=session.config.max_questions,
    )


@router.post("/end")
def end_interview(session_id: str):
    if session_id in _sessions:
        _sessions.pop(session_id, None)
    return {"success": True}

@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse uploaded resume file (PDF or DOCX) using the ResumeParser.
    Returns extracted resume text and parsed structure.
    """
    temp_path = None
    try:
        from ai_service.parser import ResumeParser
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"resume_{uuid.uuid4()}{Path(file.filename).suffix}")
        
        # Write uploaded file to temp location
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
            
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Parse the resume
        parser = ResumeParser()
        resume_text = parser.extract_text_from_pdf(temp_path)
        
        if not resume_text or len(resume_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract text from resume. Please ensure the file is a valid PDF or DOCX.")
        
        # Try to parse structured data, but return text even if parsing fails
        try:
            parsed_data = parser.parse_resume_text(resume_text)
            parsed_section = {
                "name": parsed_data.header.name if parsed_data.header else "Unknown",
                "email": parsed_data.header.email if parsed_data.header else "Not found",
                "phone": parsed_data.header.phone if parsed_data.header else None,
                "skills": parsed_data.skills.dict() if parsed_data.skills else {
                    "languages": [],
                    "frameworks": [],
                    "tools": [],
                    "other": []
                },
                "experience": [
                    {
                        "company": exp.company,
                        "position": exp.title,
                        "start_date": exp.start_date,
                        "end_date": exp.end_date,
                        "bullets": exp.bullets
                    }
                    for exp in parsed_data.experience
                ],
                "education": [
                    {
                        "school": edu.school,
                        "degree": edu.degree,
                        "graduation_date": edu.graduation_date,
                        "gpa": edu.gpa
                    }
                    for edu in parsed_data.education
                ]
            }
        except Exception as parse_err:
            # If structured parsing fails, still return the extracted text
            print(f"Warning: Structured parsing failed: {str(parse_err)}")
            parsed_section = {
                "name": "Unknown",
                "email": "Not found",
                "phone": "Not found",
                "skills": [],
                "experience": [],
                "education": []
            }
        
        return {
            "success": True,
            "resume_text": resume_text,
            "parsed": parsed_section
        }
                
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Resume parsing error: {error_msg}")
        raise HTTPException(status_code=400, detail=f"Failed to parse resume: {error_msg}")
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as cleanup_err:
                print(f"Warning: Failed to clean up temp file: {cleanup_err}")