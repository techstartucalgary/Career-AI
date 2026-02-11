import numpy as np
import sounddevice as sd
from google.cloud import speech

from .. import config


class SpeechToText:
    def __init__(self):
        self.client = speech.SpeechClient()
        self.recognition_config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=config.STT_SAMPLE_RATE,
            language_code=config.STT_LANGUAGE,
            enable_automatic_punctuation=True,
        )

    def record_from_mic(
        self,
        silence_timeout: float = 3.0,
        silence_threshold: int = 500,
    ) -> np.ndarray:
        """Record audio from the default microphone, stopping after silence.

        Listens indefinitely until `silence_timeout` seconds of continuous
        silence is detected after speech has started.
        Silence is defined as all samples in a chunk falling below
        `silence_threshold` (int16 amplitude).

        Returns raw int16 PCM samples.
        """
        sample_rate = config.STT_SAMPLE_RATE
        chunk_duration = 0.1  # check every 100ms
        chunk_size = int(sample_rate * chunk_duration)

        chunks: list[np.ndarray] = []
        silent_chunks = 0
        silent_chunks_needed = int(silence_timeout / chunk_duration)
        speech_started = False

        print("  Listening... (speak now)")

        stream = sd.InputStream(
            samplerate=sample_rate,
            channels=1,
            dtype=np.int16,
            blocksize=chunk_size,
        )
        stream.start()

        try:
            while True:
                data, _ = stream.read(chunk_size)
                chunk = data.flatten()
                chunks.append(chunk)

                amplitude = np.max(np.abs(chunk))
                is_silent = amplitude < silence_threshold

                if not is_silent:
                    speech_started = True
                    silent_chunks = 0
                elif speech_started:
                    silent_chunks += 1
                    if silent_chunks >= silent_chunks_needed:
                        break
        finally:
            stream.stop()
            stream.close()

        print("  Recording complete")
        return np.concatenate(chunks) if chunks else np.array([], dtype=np.int16)

    def transcribe(self, audio_data: np.ndarray) -> str:
        """Send recorded audio to Google Cloud STT and return the transcript."""
        audio_bytes = audio_data.tobytes()
        audio = speech.RecognitionAudio(content=audio_bytes)

        response = self.client.recognize(config=self.recognition_config, audio=audio)

        if not response.results:
            return ""

        return " ".join(
            result.alternatives[0].transcript
            for result in response.results
            if result.alternatives
        )

    def listen(self) -> str:
        """Record from mic (auto-stops on silence) and return transcribed text."""
        audio_data = self.record_from_mic()
        return self.transcribe(audio_data)
