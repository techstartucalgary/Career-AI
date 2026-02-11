from datetime import datetime

from . import config
from .conversation import InterviewConversation
from .audio.speech_to_text import SpeechToText
from .audio.text_to_speech import TextToSpeech
from .models import (
    InterviewConfig,
    InterviewSession,
    InterviewStatus,
    MessageRole,
)


class Interviewer:
    """Orchestrates a full voice-based mock interview session."""

    def __init__(self, interview_config: InterviewConfig):
        self.session = InterviewSession(config=interview_config)
        self.conversation = InterviewConversation(
            job_description=interview_config.job_description,
            resume=interview_config.resume,
            additional_topics=interview_config.additional_topics,
        )
        self.stt = SpeechToText()
        self.tts = TextToSpeech()

    def _say(self, text: str):
        """Print and speak interviewer text, record it in the session."""
        print(f"\n  Interviewer: {text}\n")
        self.session.add_message(MessageRole.INTERVIEWER, text)
        self.tts.speak(text)

    def _listen(self) -> str:
        """Record candidate audio, transcribe, and store in session."""
        text = self.stt.listen()
        if text.strip():
            print(f"  You: {text}\n")
            self.session.add_message(MessageRole.CANDIDATE, text)
        return text

    def _should_exit(self, text: str) -> bool:
        lower = text.lower()
        return any(phrase in lower for phrase in config.EXIT_PHRASES)

    def run(self):
        """Run the full interview loop."""
        print("\n" + "=" * 50)
        print("  INTERVIEW SESSION")
        print("=" * 50)
        print("  Say 'end interview' or 'goodbye' to finish.\n")

        self.session.status = InterviewStatus.IN_PROGRESS
        self.session.started_at = datetime.now()

        # Opening
        opening = self.conversation.start_interview()
        self._say(opening)

        # Main loop
        while True:
            candidate_text = self._listen()

            if not candidate_text.strip():
                print("  (No speech detected — try again)")
                continue

            if self._should_exit(candidate_text):
                closing = self.conversation.wrap_up()
                self._say(closing)
                break

            self.session.question_count += 1

            if self.session.question_count >= self.session.config.max_questions:
                response = self.conversation.prompt_wrap_up(candidate_text)
            else:
                response = self.conversation.respond(candidate_text)

            self._say(response)

        # Done
        self.session.status = InterviewStatus.COMPLETED
        self.session.ended_at = datetime.now()

        print("\n" + "=" * 50)
        print("  SESSION COMPLETE")
        print(f"  Questions: {self.session.question_count}")
        duration = self.session.ended_at - self.session.started_at
        print(f"  Duration:  {int(duration.total_seconds())}s")
        print("=" * 50)

        return self.session
