"""
Speech routes - Speech-to-text transcription endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import base64
from pathlib import Path
import sys
import os
import json
import requests

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

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if GOOGLE_API_KEY:
    print(f"✓ Google API key found (length: {len(GOOGLE_API_KEY)})")
else:
    print("⚠ No GOOGLE_API_KEY or GEMINI_API_KEY found in environment")

router = APIRouter(prefix="/api/speech", tags=["Speech"])


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file using Google Cloud Speech-to-Text REST API.
    Accepts: WAV, MP3, FLAC, OGG
    Returns: Transcribed text
    """
    try:
        print(f"\n📝 Transcription request received")
        print(f"   File: {file.filename}, Content-Type: {file.content_type}")
        
        if not GOOGLE_API_KEY:
            print("❌ No API key available")
            raise HTTPException(status_code=501, detail="Google API key not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
        
        # Read audio content
        content = await file.read()
        print(f"   Audio bytes: {len(content)}")
        
        if not content:
            print("❌ Audio file is empty")
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Encode to base64
        audio_base64 = base64.b64encode(content).decode('utf-8')
        print(f"   Base64 length: {len(audio_base64)}")
        
        # Detect audio format from filename
        filename = file.filename.lower()
        if filename.endswith('.wav'):
            encoding = "LINEAR16"
        elif filename.endswith('.mp3'):
            encoding = "MP3"
        elif filename.endswith('.flac'):
            encoding = "FLAC"
        elif filename.endswith(('.ogg', '.webm', '.opus')):
            encoding = "OGG_OPUS"
        elif filename.endswith(('.mp4', '.m4a')):
            encoding = "MP3"  # MP4 audio uses similar encoding
        else:
            encoding = "OGG_OPUS"  # Default for webm
        
        print(f"   Encoding: {encoding}")
        
        # Call Google Speech-to-Text REST API
        url = f"https://speech.googleapis.com/v1/speech:recognize?key={GOOGLE_API_KEY}"
        
        # Build config
        config = {
            "encoding": encoding,
            "languageCode": "en-US",
            "enableAutomaticPunctuation": True,
            "model": "default",
        }
        
        # Add sample rate for OGG_OPUS (48kHz is standard for webm)
        if encoding == "OGG_OPUS":
            config["sampleRateHertz"] = 48000
        
        payload = {
            "config": config,
            "audio": {
                "content": audio_base64
            }
        }
        
        print("   Sending to Google Speech-to-Text API...")
        response = requests.post(url, json=payload, timeout=30)
        print(f"   Response status: {response.status_code}")
        
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', 'Unknown error')
            print(f"❌ API Error: {error_msg}")
            print(f"   Full error response: {error_data}")
            raise HTTPException(status_code=400, detail=f"Speech API error: {error_msg}")
        
        result = response.json()
        print(f"   Full API response: {json.dumps(result, indent=2)}")
        
        # Extract transcript
        transcript = ""
        confidence = 0
        
        if 'results' in result and result['results']:
            for result_obj in result['results']:
                if 'alternatives' in result_obj and result_obj['alternatives']:
                    transcript += result_obj['alternatives'][0].get('transcript', '')
                    confidence = result_obj['alternatives'][0].get('confidence', 0)
        
        print(f"✓ Transcription complete: '{transcript}' (confidence: {confidence})")
        
        return {
            "success": True,
            "transcript": transcript.strip(),
            "confidence": confidence
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Transcription failed: {str(e)}")
