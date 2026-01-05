# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Agents Module

This module provides LLM-powered agents for automated release management tasks.
Agents use Large Language Models to perform intelligent operations such as
generating release summaries, analyzing commit messages, and creating
bilingual documentation.

Available Agents:
    - SummaryAgent: Generates release notes from git commits

Base Classes:
    - BaseAgent: Abstract base class for all LLM agents
    - AgentContext: Execution context for agent operations

Data Models:
    - CommitInfo: Git commit information container
    - ReleaseSummary: Generated release summary container

Import Paths:
    - core.agents.base: BaseAgent, AgentContext
    - core.agents.summary: SummaryAgent, CommitInfo, ReleaseSummary

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

# Base classes
from .base import BaseAgent, AgentContext

# Summary Agent for generating release notes
from .summary import (
    SummaryAgent,
    CommitInfo,
    ReleaseSummary,
    create_summary_agent,
)

__all__ = [
    # Base
    "BaseAgent",
    "AgentContext",
    # Summary Agent
    "SummaryAgent",
    "CommitInfo",
    "ReleaseSummary",
    "create_summary_agent",
]
