import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
load_dotenv(Path(__file__).parent.parent / ".env")

# Gemini (reuses the same key as the rest of the project)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("INTERVIEW_GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TEMPERATURE = float(os.getenv("INTERVIEW_TEMPERATURE", "0.7"))

# Google Cloud Speech-to-Text
STT_LANGUAGE = os.getenv("INTERVIEW_STT_LANGUAGE", "en-US")
STT_SAMPLE_RATE = int(os.getenv("INTERVIEW_STT_SAMPLE_RATE", "16000"))

# Google Cloud Text-to-Speech
TTS_VOICE_NAME = os.getenv("INTERVIEW_TTS_VOICE", "en-US-Neural2-F")
TTS_SPEAKING_RATE = float(os.getenv("INTERVIEW_TTS_SPEAKING_RATE", "1.0"))

# Interview defaults
MAX_QUESTIONS = int(os.getenv("INTERVIEW_MAX_QUESTIONS", "10"))
RECORD_DURATION_SECONDS = int(os.getenv("INTERVIEW_RECORD_DURATION", "30"))
EXIT_PHRASES = ["goodbye", "end interview", "that's all", "stop interview"]
