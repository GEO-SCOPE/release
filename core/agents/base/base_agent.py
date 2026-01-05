# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Base Agent Implementation

This module provides the abstract base class for all LLM-powered agents.
BaseAgent offers a unified interface for interacting with Large Language
Models through the Oracle client, with support for prompt loading and
batch query operations.

Architecture:
    - BaseAgent provides Oracle (LLM client) and optional prompt loading
    - All LLM calls go through Oracle (self._oracle)
    - Subclasses implement specific business logic

IMPORTANT: This is for LLM agents only.
    - For pure computation, use classes in core/tools instead.
    - For prompt assembly without LLM, use core/tools/prompt_builder.py.

Usage:
    class MyAgent(BaseAgent):
        def generate(self, input: str) -> str:
            prompt = self._load_prompt("my_prompt.md")
            return self.query(prompt, input)

    agent = MyAgent(model="gpt-4o", prompts_dir=Path("prompts"))
    result = agent.generate("Hello")

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.tools.prompt_loader import PromptLoader
from utils.oracle import Oracle
from utils.logger import ModernLogger


@dataclass
class AgentContext:
    """
    Context container for agent execution.

    Provides project-specific information and configuration that agents
    may need during execution.

    Attributes:
        project_id: Unique identifier for the project.
        brand: Brand name associated with the project.
        industry: Industry classification.
        language: Response language code (default: "zh").
        extra: Additional key-value pairs for custom context.
    """
    project_id: str
    brand: str
    industry: str
    language: str = "zh"
    extra: Dict[str, Any] = field(default_factory=dict)


class BaseAgent(ModernLogger):
    """
    Base class for LLM-based agents.

    All agents that use LLM should inherit from this class.
    For pure computation or prompt-only operations, use core/tools instead.

    Attributes:
        name: Agent identifier string.
        DEFAULT_MODEL: Default LLM model to use.

    Example:
        class MyAgent(BaseAgent):
            def generate(self, input: str) -> str:
                prompt = self._load_prompt("my_prompt.md")
                return self.query(prompt, input)

        agent = MyAgent(model="gpt-4o", prompts_dir=Path("prompts"))
        result = agent.generate("Hello")
    """

    name: str = "base"
    DEFAULT_MODEL = "gpt-4o"

    def __init__(
        self,
        model: Optional[str] = None,
        prompts_dir: Optional[Path] = None,
    ):
        """
        Initialize BaseAgent with LLM support.

        Args:
            model: LLM model name (defaults to DEFAULT_MODEL).
            prompts_dir: Optional path to prompts directory for loading templates.

        Raises:
            RuntimeError: If Oracle initialization fails (e.g., missing API key).
        """
        super().__init__()
        # Initialize Oracle (LLM client)
        self._model_name = model or self.DEFAULT_MODEL
        self._oracle: Optional[Oracle] = Oracle(model=self._model_name)
        self.system_prompt = ""
        self.prompts_dir = prompts_dir
        self._prompt_loader = PromptLoader(prompts_dir) if prompts_dir else None

    # =========================================================================
    # LLM Query Methods
    # =========================================================================

    def query(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
    ) -> str:
        """
        Query LLM with system and user prompts.

        Args:
            system_prompt: System/instruction prompt for the LLM.
            user_prompt: User input/question to process.
            temperature: LLM temperature for response variability (0.0-1.0).

        Returns:
            str: LLM response text.

        Raises:
            RuntimeError: If Oracle is not initialized.
        """
        if not self._oracle:
            raise RuntimeError("Oracle not initialized")
        return self._oracle.query(system_prompt, user_prompt, temperature)

    def query_batch(
        self,
        system_prompt: str,
        user_prompts: List[str],
        temperature: float = 0.7,
    ) -> List[str]:
        """
        Query LLM with multiple user prompts in parallel.

        Args:
            system_prompt: System/instruction prompt (shared across all queries).
            user_prompts: List of user inputs to process.
            temperature: LLM temperature for response variability.

        Returns:
            List[str]: List of LLM responses corresponding to each input.

        Raises:
            RuntimeError: If Oracle is not initialized.
        """
        if not self._oracle:
            raise RuntimeError("Oracle not initialized")
        return self._oracle.query_all(system_prompt, user_prompts, temperature)

    # =========================================================================
    # Legacy Compatibility Methods
    # =========================================================================

    def answer(self, question: str) -> str:
        """
        Query LLM using instance's system_prompt.

        Legacy method for backward compatibility.
        Prefer using query() with explicit system prompt.

        Args:
            question: User question/input to process.

        Returns:
            str: LLM response text.
        """
        return self.query(self.system_prompt, question)

    def answer_multiple(self, questions: List[str]) -> List[str]:
        """
        Query LLM with multiple questions using instance's system_prompt.

        Legacy method for backward compatibility.
        Prefer using query_batch() with explicit system prompt.

        Args:
            questions: List of questions to process.

        Returns:
            List[str]: List of LLM responses.
        """
        return self.query_batch(self.system_prompt, questions)

    # =========================================================================
    # Prompt Loading Methods
    # =========================================================================

    def _load_prompt(self, filename: str) -> str:
        """
        Load prompt template from file.

        Args:
            filename: Name of the prompt file to load.

        Returns:
            str: Prompt content as string.

        Raises:
            RuntimeError: If prompts_dir was not configured during init.
        """
        if not self._prompt_loader:
            raise RuntimeError("prompts_dir not configured")
        return self._prompt_loader.load(filename)

    # =========================================================================
    # Properties
    # =========================================================================

    @property
    def model(self) -> Optional[Oracle]:
        """
        Get Oracle client instance.

        Returns:
            Optional[Oracle]: The Oracle LLM client, or None if not initialized.
        """
        return self._oracle

    @property
    def model_name(self) -> str:
        """
        Get the configured model name.

        Returns:
            str: Name of the LLM model being used.
        """
        return self._model_name

    # =========================================================================
    # Abstract Methods (for subclasses to override)
    # =========================================================================

    def run(self, ctx: AgentContext, **kwargs) -> Any:
        """
        Run the agent with context.

        Override this method in subclasses to implement specific agent logic.

        Args:
            ctx: Agent context with project information.
            **kwargs: Additional arguments for the agent.

        Returns:
            Any: Agent execution result.

        Raises:
            NotImplementedError: If subclass does not implement this method.
        """
        raise NotImplementedError("Subclasses must implement run()")
