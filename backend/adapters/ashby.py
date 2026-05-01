"""
Ashby ATS adapter (stub).
"""
from typing import List, Callable, Optional

from adapters.base import BoardAdapter
from adapters.dispatcher import register_adapter
from models_application import FormField, SubmitResult


class AshbyAdapter(BoardAdapter):
    """Stub adapter for Ashby boards."""

    PATTERNS = ["ashbyhq.com", "jobs.ashby.com"]

    def matches(self, url: str) -> bool:
        return any(p in url.lower() for p in self.PATTERNS)

    async def extract_questions(self, url: str) -> List[FormField]:
        raise NotImplementedError("Ashby adapter not yet implemented")

    async def submit_application(
        self,
        page,
        url: str,
        profile: dict,
        answers: dict,
        resume_path: Optional[str] = None,
        cover_letter_path: Optional[str] = None,
        emit_progress: Optional[Callable] = None,
    ) -> SubmitResult:
        raise NotImplementedError("Ashby adapter not yet implemented")


# Auto-register on import
register_adapter(AshbyAdapter())
