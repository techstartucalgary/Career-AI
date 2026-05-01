"""
Abstract base class for board adapters.
Each adapter knows how to extract questions from and submit applications to
a specific ATS (Greenhouse, Lever, Ashby, etc.).
"""
from abc import ABC, abstractmethod
from typing import List, Callable, Optional

from models_application import FormField, SubmitResult


class BoardAdapter(ABC):
    """
    Base class every board adapter must implement.
    """

    @abstractmethod
    def matches(self, url: str) -> bool:
        """Return True if this adapter handles the given job URL."""
        ...

    @abstractmethod
    async def extract_questions(self, url: str) -> List[FormField]:
        """
        Fetch the application page and return the list of form fields
        the applicant needs to fill.
        """
        ...

    @abstractmethod
    async def submit_application(
        self,
        page,  # Playwright Page
        url: str,
        profile: dict,
        answers: dict,
        resume_path: Optional[str] = None,
        cover_letter_path: Optional[str] = None,
        emit_progress: Optional[Callable] = None,
    ) -> SubmitResult:
        """
        Fill and submit the application form on the given Playwright page.
        ``emit_progress`` is an optional callback to stream field-level events.
        """
        ...
