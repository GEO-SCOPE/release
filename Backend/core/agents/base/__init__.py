# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Base Agent Module

This module provides the foundational base class and context model for all
LLM-powered agents in the system. All agents that interact with Large
Language Models should inherit from BaseAgent.

Classes:
    - BaseAgent: Abstract base class providing Oracle (LLM client) integration
    - AgentContext: Data container for agent execution context

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from .base_agent import BaseAgent, AgentContext

__all__ = ["BaseAgent", "AgentContext"]
