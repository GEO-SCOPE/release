# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Summary Agent Module

This module provides LLM-powered agents for generating release summaries
from git commit information. The SummaryAgent analyzes commit messages
and produces bilingual (English/Chinese) release notes with structured
changelog entries.

Classes:
    - SummaryAgent: Main agent for generating release summaries
    - CommitInfo: Data container for git commit information
    - ReleaseSummary: Data container for generated release summary

Functions:
    - create_summary_agent: Factory function for creating SummaryAgent instances

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2024-2025 GEO-SCOPE.ai. All rights reserved.
"""

from .summary_agent import SummaryAgent, CommitInfo, ReleaseSummary, create_summary_agent

__all__ = [
    "SummaryAgent",
    "CommitInfo",
    "ReleaseSummary",
    "create_summary_agent",
]
