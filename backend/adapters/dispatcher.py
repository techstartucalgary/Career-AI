"""
Adapter registry and dispatcher.
Call ``get_adapter(url)`` to get the correct board adapter for a job URL,
or ``None`` if the board is not supported.
"""
from typing import Optional, List

from adapters.base import BoardAdapter

_registry: List[BoardAdapter] = []


def register_adapter(adapter: BoardAdapter) -> None:
    """Register a board adapter instance."""
    _registry.append(adapter)


def get_adapter(url: str) -> Optional[BoardAdapter]:
    """Return the first adapter that matches *url*, or None."""
    for adapter in _registry:
        if adapter.matches(url):
            return adapter
    return None
