"""
Gemini LLM provider implementation
"""
from typing import List, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage
from .base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini provider using LangChain

    Supports: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro, etc.
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-2.5-flash",
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """
        Initialize Gemini provider

        Args:
            api_key: Google Gemini API key
            model_name: Gemini model name
            temperature: Sampling temperature
            max_tokens: Max output tokens (None = model default)
            **kwargs: Additional parameters
        """
        super().__init__(model_name, temperature, **kwargs)

        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
            **kwargs
        )

    def invoke(self, messages: List[BaseMessage], **kwargs) -> Any:
        """
        Invoke Gemini with messages

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
