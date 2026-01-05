# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/oracle.py
Description: OpenKey LLM client with unified interface.
             Supports multiple models (GPT-4, Claude, Gemini, Doubao, etc.)
             via OpenKey proxy for generating release summaries and changelogs.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from __future__ import annotations

import os
import logging
from typing import List, Optional

from openai import OpenAI

from .parallel import ParallelProcessor

# Disable verbose HTTP logging
logging.getLogger("openai").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.WARNING)


class OracleError(Exception):
    """Exception raised for Oracle-related errors."""
    pass


class Oracle(ParallelProcessor):
    """
    Unified LLM client using OpenKey proxy.

    Provides a consistent interface for querying various LLM models through
    the OpenKey proxy service, supporting both single and batch queries.

    Usage:
        oracle = Oracle("gpt-4o")
        response = oracle.query("You are helpful.", "Hello!")

        oracle = Oracle("claude-3-opus-20240229")
        response = oracle.query("You are helpful.", "Hello!")

    Attributes:
        model: The model name/ID being used.
        model_name: Alias for model (for compatibility).
    """

    def __init__(
        self,
        model: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        """
        Initialize Oracle with specified model.

        Sets up the OpenAI-compatible client with the provided or
        environment-configured credentials.

        Args:
            model: Model name/ID to use for queries.
            api_key: API key (uses OPENKEY_API_KEY env var if not specified).
            base_url: Base URL (uses OPENKEY_BASE_URL env var or default if not specified).
        """
        super().__init__()
        self.model = model
        self.model_name = model  # Alias for compatibility
        self._client = None
        self._api_key = api_key or os.getenv("OPENKEY_API_KEY")
        self._base_url = base_url or os.getenv("OPENKEY_BASE_URL", "https://api.openai.com/v1")
        self._init_client()

    def _init_client(self):
        """
        Initialize the OpenAI-compatible client.

        Creates a new OpenAI client instance with configured credentials.
        """
        self._client = OpenAI(api_key=self._api_key, base_url=self._base_url)

    def query(
        self,
        prompt_sys: str,
        prompt_user: str,
        temp: float = 0.0,
        top_p: float = 0.9,
        logprobs: bool = False,
        query_key: Optional[str] = None,
    ) -> str:
        """
        Query the model with system and user prompts.

        Sends a chat completion request to the configured model and returns
        the generated response text.

        Args:
            prompt_sys: System prompt defining the assistant's behavior.
            prompt_user: User prompt containing the query.
            temp: Temperature parameter (0.0 - 1.0) for response randomness.
            top_p: Top-p sampling parameter for nucleus sampling.
            logprobs: Whether to return log probabilities.
            query_key: Optional key for identifying the query.

        Returns:
            Model response text, or error message if query fails.
        """
        try:
            return self._query_openai(prompt_sys, prompt_user, temp, top_p, logprobs)
        except Exception as e:
            return f"QUERY_FAILED: {str(e)}"

    def _query_openai(
        self,
        prompt_sys: str,
        prompt_user: str,
        temp: float,
        top_p: float,
        logprobs: bool,
    ) -> str:
        """
        Query OpenAI-compatible API.

        Internal method that handles the actual API call to the LLM service.

        Args:
            prompt_sys: System prompt.
            prompt_user: User prompt.
            temp: Temperature parameter.
            top_p: Top-p parameter.
            logprobs: Whether to request log probabilities.

        Returns:
            Model response text.
        """
        try:
            completion = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt_sys},
                    {"role": "user", "content": prompt_user},
                ],
                temperature=temp,
                top_p=top_p,
                logprobs=logprobs,
            )
            return completion.choices[0].message.content or ""
        except Exception:
            # Retry without logprobs if initial request fails
            completion = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt_sys},
                    {"role": "user", "content": prompt_user},
                ],
                temperature=temp,
                top_p=top_p,
            )
            return completion.choices[0].message.content or ""

    def query_all(
        self,
        prompt_sys: str,
        prompt_user_all: List[str],
        workers: Optional[int] = None,
        temp: float = 0.0,
        top_p: float = 0.9,
        query_key_list: Optional[List[str]] = None,
        batch_size: int = 10,
        max_retries: int = 2,
        timeout: int = 3000,
        **kwargs,
    ) -> List[str]:
        """
        Query all prompts in parallel.

        Processes multiple user prompts concurrently using the parallel
        processing infrastructure for improved throughput.

        Args:
            prompt_sys: System prompt (shared across all queries).
            prompt_user_all: List of user prompts to process.
            workers: Number of worker threads (auto-determined if None).
            temp: Temperature parameter.
            top_p: Top-p sampling parameter.
            query_key_list: Optional list of query identifiers.
            batch_size: Batch size for processing.
            max_retries: Maximum retry attempts per query.
            timeout: Timeout in seconds per query.
            **kwargs: Additional keyword arguments.

        Returns:
            List of model responses in the same order as input prompts.
        """
        query_key_list = query_key_list or []

        query_items = []
        for i, prompt in enumerate(prompt_user_all):
            key = query_key_list[i] if i < len(query_key_list) else None
            query_items.append((prompt, key))

        def process_func(item, prompt_sys=prompt_sys, temp=temp, top_p=top_p):
            prompt, key = item
            try:
                return self.query(prompt_sys, prompt, temp, top_p, query_key=key)
            except Exception as e:
                return f"QUERY_FAILED: {str(e)}"

        workers = workers or min(32, (os.cpu_count() or 4) * 4)

        return self.parallel_process(
            items=query_items,
            process_func=process_func,
            workers=workers,
            batch_size=batch_size,
            max_retries=max_retries,
            timeout=timeout,
            task_description=f"Processing queries ({self.model})",
        )

    def __repr__(self) -> str:
        """
        Return string representation of Oracle instance.

        Returns:
            String showing the model being used.
        """
        return f"Oracle(model={self.model})"
