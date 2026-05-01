"""
Shared resilience helpers for board adapters.
"""
import asyncio
import base64
import time
from typing import Any, Callable, Coroutine, Optional


async def retry_action(
    action: Callable[..., Coroutine],
    *args: Any,
    max_attempts: int = 3,
    backoff: list[float] | None = None,
    label: str = "action",
    **kwargs: Any,
) -> Any:
    """
    Retry an async action with exponential backoff.
    Catches playwright TimeoutError and general Exception.

    Returns the action's return value on success.
    Raises the last exception on final failure.
    """
    if backoff is None:
        backoff = [1, 3, 9]

    last_exc = None
    for attempt in range(max_attempts):
        try:
            start = time.monotonic()
            result = await action(*args, **kwargs)
            elapsed = int((time.monotonic() - start) * 1000)
            return result
        except Exception as exc:
            last_exc = exc
            if attempt < max_attempts - 1:
                delay = backoff[min(attempt, len(backoff) - 1)]
                print(f"[retry] {label} attempt {attempt + 1} failed: {exc}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                print(f"[retry] {label} failed after {max_attempts} attempts: {exc}")

    raise last_exc


async def safe_screenshot(page, label: str = "screenshot") -> Optional[str]:
    """
    Take a screenshot that never raises. Returns base64 PNG string or None.
    """
    try:
        png = await page.screenshot(type="png", full_page=False, timeout=10000)
        return base64.b64encode(png).decode("utf-8")
    except Exception as e:
        print(f"[screenshot] Failed to capture '{label}': {e}")
        return None


def log_action(
    application_id: str,
    action: str,
    selector: str = "",
    result: str = "ok",
    duration_ms: int = 0,
    extra: dict | None = None,
):
    """Structured log line for adapter actions."""
    parts = [
        f"[adapter] app={application_id}",
        f"action={action}",
    ]
    if selector:
        parts.append(f"sel={selector}")
    parts.append(f"result={result}")
    if duration_ms:
        parts.append(f"ms={duration_ms}")
    if extra:
        for k, v in extra.items():
            parts.append(f"{k}={v}")
    print(" ".join(parts))
