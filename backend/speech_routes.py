"""
Speech routes - Speech-to-text transcription endpoints using Gemini
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import base64
from pathlib import Path
import sys
import os
import json
import requests
import tempfile

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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if GEMINI_API_KEY:
    print(f"✓ Gemini API key found (length: {len(GEMINI_API_KEY)})")
else:
    print("⚠ No GEMINI_API_KEY or GOOGLE_API_KEY found in environment")

router = APIRouter(prefix="/api/speech", tags=["Speech"])


def get_mime_type(filename: str, content_type: str) -> str:
    """Determine the MIME type for audio file."""
    filename = filename.lower() if filename else ""
    
    if filename.endswith('.wav'):
        return "audio/wav"
    elif filename.endswith('.mp3'):
        return "audio/mp3"
    elif filename.endswith('.flac'):
        return "audio/flac"
    elif filename.endswith('.ogg'):
        return "audio/ogg"
    elif filename.endswith('.webm'):
        return "audio/webm"
    elif filename.endswith(('.mp4', '.m4a')):
        return "audio/mp4"
    elif content_type and 'audio' in content_type:
        return content_type.split(';')[0]  # Remove codecs info
    else:
        return "audio/webm"  # Default


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file using Gemini API.
    Accepts: WAV, MP3, FLAC, OGG, WebM
    Returns: Transcribed text
    """
    try:
        print(f"\n📝 Transcription request received")
        print(f"   File: {file.filename}, Content-Type: {file.content_type}")
        
        if not GEMINI_API_KEY:
            print("❌ No API key available")
            raise HTTPException(status_code=501, detail="Gemini API key not configured. Set GEMINI_API_KEY environment variable.")
        
        # Read audio content
        content = await file.read()
        print(f"   Audio bytes: {len(content)}")
        
        if not content:
            print("❌ Audio file is empty")
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        if len(content) < 1000:
            print("⚠️ Audio file too small, likely no speech")
            return {
                "success": True,
                "transcript": "",
                "confidence": 0
            }
        
        # Encode to base64
        audio_base64 = base64.b64encode(content).decode('utf-8')
        mime_type = get_mime_type(file.filename, file.content_type)
        print(f"   MIME type: {mime_type}")
        print(f"   Base64 length: {len(audio_base64)}")
        
        # Use Gemini API for transcription
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [
                    {
                        "text": "Transcribe the following audio exactly as spoken. Only output the transcription text, nothing else. If there is no speech or the audio is silent, respond with exactly: [NO_SPEECH]"
                    },
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": audio_base64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 2048
            }
        }
        
        print("   Sending to Gemini API for transcription...")
        response = requests.post(url, json=payload, timeout=60)
        print(f"   Response status: {response.status_code}")
        
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', 'Unknown error')
            print(f"❌ Gemini API Error: {error_msg}")
            print(f"   Full error response: {json.dumps(error_data, indent=2)}")
            raise HTTPException(status_code=400, detail=f"Gemini API error: {error_msg}")
        
        result = response.json()
        
        # Extract transcript from Gemini response
        transcript = ""
        try:
            candidates = result.get('candidates', [])
            if candidates:
                content_parts = candidates[0].get('content', {}).get('parts', [])
                if content_parts:
                    transcript = content_parts[0].get('text', '').strip()
        except (KeyError, IndexError) as e:
            print(f"⚠️ Failed to parse Gemini response: {e}")
            print(f"   Response: {json.dumps(result, indent=2)}")
        
        # Handle no speech case
        if transcript == "[NO_SPEECH]" or not transcript:
            print("⚠️ No speech detected in audio")
            transcript = ""
        
        print(f"✓ Transcription complete: '{transcript[:100]}...' ({len(transcript)} chars)")
        
        return {
            "success": True,
            "transcript": transcript,
            "confidence": 0.9 if transcript else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Transcription failed: {str(e)}")
