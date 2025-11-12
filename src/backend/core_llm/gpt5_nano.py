"""
LLM Client for OpenAI GPT-5 Nano
Handles interactions with the OpenAI API for RAG applications
"""
from openai import OpenAI
from typing import List, Dict, Optional
import os


class LLMClient:
    """Client for interacting with OpenAI's GPT-5 Nano model"""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-5-nano"):
        """
        Initialize the LLM client

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env variable)
            model: Model name to use (default: gpt-5-nano)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key must be provided or set as OPENAI_API_KEY environment variable")

        self.client = OpenAI(api_key=self.api_key)
        self.model = model

    def generate_response(
            self,
            user_query: str,
            context: Optional[str] = None,
            system_prompt: Optional[str] = None,
            max_completion_tokens: int = 2000,
            conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, any]:
        # ... as before ...
        # Keep context window safe
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        else:
            default_system = "You are a helpful assistant. Answer questions based on the provided context."
            messages.append({"role": "system", "content": default_system})

        # Shorten history if needed
        if conversation_history:
            # OpenAI API is resilient, but messages >12 can overflow for small models (nano likely 4K tokens)
            messages.extend(conversation_history[-8:])

        augmented_query = f"Context:\n{context}\n\nQuestion: {user_query}" if context else user_query
        messages.append({"role": "user", "content": augmented_query})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_completion_tokens
                # changed from max_completion_tokens to max_tokens for API compatibility
            )
            result = {
                "success": True,
                "response": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": response.choices[0].finish_reason
            }
            return result
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": None
            }

    def generate_streaming_response(
            self,
            user_query: str,
            context: Optional[str] = None,
            system_prompt: Optional[str] = None,
            max_completion_tokens: int = 2000
    ):
        """
        Generate a streaming response using GPT-5 Nano

        Args:
            Same as generate_response

        Yields:
            Response chunks as they arrive

        Note: GPT-5 Nano only supports default temperature (1.0)
        """
        # Build the messages
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        else:
            default_system = "You are a helpful assistant. Answer questions based on the provided context."
            messages.append({"role": "system", "content": default_system})

        if context:
            augmented_query = f"Context:\n{context}\n\nQuestion: {user_query}"
            messages.append({"role": "user", "content": augmented_query})
        else:
            messages.append({"role": "user", "content": user_query})

        try:
            # Call OpenAI API with streaming
            # Note: GPT-5 Nano only supports default temperature (1.0)
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_completion_tokens=max_completion_tokens,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield f"Error: {str(e)}"