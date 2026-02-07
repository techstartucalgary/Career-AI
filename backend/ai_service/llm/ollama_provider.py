"""
Ollama LLM provider implementation (for local models)
"""
from typing import List, Any, Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage, HumanMessage
from .base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    """
    Ollama provider for local models

    Supports: phi3.5, qwen2.5:7b, llama3.3:8b, mistral, etc.

    Requirements:
    - Ollama must be installed and running (https://ollama.ai)
    - Model must be pulled: `ollama pull phi3.5`
    """

    def __init__(
        self,
        model_name: str = "phi3.5",
        temperature: float = 0.3,
        base_url: str = "http://localhost:11434",
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """
        Initialize Ollama provider

        Args:
            model_name: Ollama model name (phi3.5, qwen2.5:7b, etc.)
            temperature: Sampling temperature
            base_url: Ollama server URL
            max_tokens: Max output tokens (None = model default)
            **kwargs: Additional parameters
        """
        super().__init__(model_name, temperature, **kwargs)

        self.llm = ChatOllama(
            model=model_name,
            temperature=temperature,
            base_url=base_url,
            num_predict=max_tokens,
            **kwargs
        )

    def invoke(self, messages: List[BaseMessage], **kwargs) -> Any:
        """
        Invoke Ollama with messages

        Args:
            messages: List of LangChain messages
            **kwargs: Additional parameters

        Returns:
            Response with .content attribute
        """
        return self.llm.invoke(messages, **kwargs)

    def generate_content(self, prompt: str, **kwargs) -> str:
        """
        Generate content from text prompt

        Args:
            prompt: Text prompt
            **kwargs: Additional parameters

        Returns:
            Generated text
        """
        response = self.llm.invoke([HumanMessage(content=prompt)], **kwargs)
        return response.content
