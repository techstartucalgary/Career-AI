"""
Abstract base class for LLM providers
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from langchain_core.messages import BaseMessage


class BaseLLMProvider(ABC):
    """
    Abstract interface for LLM providers

    This allows swapping between different LLM backends (Gemini, Ollama, OpenAI, etc.)
    without changing the core application logic.
    """

    def __init__(self, model_name: str, temperature: float = 0.3, **kwargs):
        """
        Initialize LLM provider

        Args:
            model_name: Name/identifier of the model
            temperature: Sampling temperature (0.0-1.0)
            **kwargs: Provider-specific configuration
        """
        self.model_name = model_name
        self.temperature = temperature
        self.config = kwargs

    @abstractmethod
    def invoke(self, messages: List[BaseMessage], **kwargs) -> Any:
        """
        Invoke the LLM with a list of messages

        Args:
            messages: List of LangChain messages
            **kwargs: Additional generation parameters

        Returns:
            Response object with .content attribute
        """
        pass

    @abstractmethod
    def generate_content(self, prompt: str, **kwargs) -> str:
        """
        Generate content from a text prompt

        Args:
            prompt: Text prompt
            **kwargs: Additional generation parameters

        Returns:
            Generated text response
        """
        pass

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model

        Returns:
            Dictionary with model metadata
        """
        return {
            "provider": self.__class__.__name__,
            "model_name": self.model_name,
            "temperature": self.temperature,
            "config": self.config
        }

    @property
    def provider_name(self) -> str:
        """Get the provider name (gemini, ollama, openai, etc.)"""
        return self.__class__.__name__.replace("Provider", "").lower()
