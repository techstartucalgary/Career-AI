import io
import wave

import numpy as np
import sounddevice as sd
from google.cloud import texttospeech

from .. import config


class TextToSpeech:
    def __init__(self):
        self.client = texttospeech.TextToSpeechClient()
        self.voice = texttospeech.VoiceSelectionParams(
            language_code=config.TTS_VOICE_NAME[:5],
            name=config.TTS_VOICE_NAME,
        )
        self.audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            sample_rate_hertz=24000,
            speaking_rate=config.TTS_SPEAKING_RATE,
        )

    def synthesize(self, text: str) -> bytes:
        """Convert text to raw WAV bytes."""
        synthesis_input = texttospeech.SynthesisInput(text=text)
        response = self.client.synthesize_speech(
            input=synthesis_input,
            voice=self.voice,
            audio_config=self.audio_config,
        )
        return response.audio_content

    def speak(self, text: str):
        """Synthesize text and play through speakers. Blocks until done."""
        wav_bytes = self.synthesize(text)

        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            sample_rate = wf.getframerate()
            samples = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16)

        sd.play(samples, samplerate=sample_rate)
        sd.wait()  # blocks until playback finishes
