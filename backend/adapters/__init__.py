"""Board adapter package for ATS-specific form handling."""
from adapters.dispatcher import get_adapter, register_adapter

# Import adapters so they auto-register
import adapters.greenhouse  # noqa: F401
import adapters.lever       # noqa: F401
import adapters.ashby       # noqa: F401

__all__ = ["get_adapter", "register_adapter"]
