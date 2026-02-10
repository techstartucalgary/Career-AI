"""
Factory for creating LLM providers
"""
from typing import Optional
from .base import BaseLLMProvider
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider


def get_llm_provider(
    provider: str = "gemini",
    model_name: Optional[str] = None,
    temperature: float = 0.3,
    api_key: Optional[str] = None,
    **kwargs
) -> BaseLLMProvider:
    """
    Factory function to create the appropriate LLM provider

    Args:
        provider: Provider name ('gemini', 'ollama')
        model_name: Model name (if None, uses provider default)
        temperature: Sampling temperature
        api_key: API key (required for cloud providers like Gemini)
        **kwargs: Additional provider-specific parameters

    Returns:
        Configured LLM provider instance

    Raises:
        ValueError: If provider is unknown or required params missing

    Examples:
        >>> # Use Gemini
        >>> llm = get_llm_provider("gemini", api_key="your-key")

        >>> # Use local Phi-3.5
        >>> llm = get_llm_provider("ollama", model_name="phi3.5")

        >>> # Use Qwen 2.5 7B
        >>> llm = get_llm_provider("ollama", model_name="qwen2.5:7b")
    """
    provider = provider.lower()

    if provider == "gemini":
        if not api_key:
            raise ValueError("Gemini provider requires api_key")

        model_name = model_name or "gemini-2.5-flash"
        return GeminiProvider(
            api_key=api_key,
            model_name=model_name,
            temperature=temperature,
            **kwargs
        )

    elif provider == "ollama":
        model_name = model_name or "phi3.5"
        return OllamaProvider(
            model_name=model_name,
            temperature=temperature,
            **kwargs
        )

    else:
        raise ValueError(
            f"Unknown provider: {provider}. "
            f"Supported providers: gemini, ollama"
        )
