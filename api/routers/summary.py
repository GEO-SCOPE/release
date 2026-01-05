# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Summary API Router

This module provides RESTful API endpoints for AI-powered release summary
generation. It uses a Large Language Model (LLM) to automatically generate
bilingual release notes and structured changelog entries from git commit
information.

Endpoints:
    POST /api/summary/generate  - Generate and optionally save summary
    POST /api/summary/preview   - Preview summary without saving

Features:
    - Automatic bilingual content generation (English + Chinese)
    - Structured changelog entry extraction from commits
    - Git commit message parsing and categorization
    - Optional database persistence

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from api.deps import verify_api_key
from core.agents.summary import SummaryAgent, CommitInfo, create_summary_agent


router = APIRouter(prefix="/api/summary", tags=["summary"])


# =============================================================================
# Request/Response Models
# =============================================================================

class CommitInput(BaseModel):
    """
    Git commit input model.

    Represents a single git commit for processing by the summary agent.

    Attributes:
        hash: The commit hash (full 40-char or short 7-char format).
        message: The commit message including subject and body.
        author: The commit author name (optional).
        date: The commit date in ISO format (optional).
    """
    hash: str = Field(..., description="Commit hash (full or short)")
    message: str = Field(..., description="Commit message")
    author: Optional[str] = Field(None, description="Commit author")
    date: Optional[str] = Field(None, description="Commit date")


class GenerateSummaryRequest(BaseModel):
    """
    Request model for generating a release summary.

    Contains version information, commit list, and options for
    controlling the summary generation process.

    Attributes:
        version: Semantic version string (e.g., '0.18.0').
        commits: List of commits to analyze and summarize.
        date: Release date in YYYY-MM-DD format (defaults to today).
        author_username: Username of the release author.
        save_to_db: Whether to persist the generated summary.
    """
    version: str = Field(..., description="Version number (e.g., '0.18.0')")
    commits: List[CommitInput] = Field(..., description="List of commits for this release")
    date: Optional[str] = Field(None, description="Release date (YYYY-MM-DD), defaults to today")
    author_username: str = Field("silan", description="Author username")
    save_to_db: bool = Field(True, description="Whether to save to database")


class ChangelogOutput(BaseModel):
    """
    Output model for a single changelog entry.

    Represents a structured changelog item generated from commit analysis.

    Attributes:
        type: Change type (feature, improve, fix, breaking, etc.).
        title: Multi-language title dictionary.
        detail: Multi-language detail dictionary (optional).
        commit_hash: Associated commit hash (optional).
    """
    type: str
    title: dict
    detail: Optional[dict] = None
    commit_hash: Optional[str] = None


class GenerateSummaryResponse(BaseModel):
    """
    Response model for summary generation.

    Contains the generated release summary including bilingual
    notes, detailed changelog, and structured entries.

    Attributes:
        success: Whether generation completed successfully.
        version: The version number processed.
        date: The release date.
        notes: Multi-language short summary dictionary.
        detail: Multi-language detailed changelog (Markdown).
        changelogs: List of structured changelog entries.
        saved_to_db: Whether summary was saved to database.
        message: Additional status message (optional).
    """
    success: bool
    version: str
    date: str
    notes: dict
    detail: dict
    changelogs: List[ChangelogOutput]
    saved_to_db: bool = False
    message: Optional[str] = None


# =============================================================================
# Endpoints
# =============================================================================

@router.post("/generate", response_model=GenerateSummaryResponse)
def generate_summary(
    request: GenerateSummaryRequest,
    _: str = Depends(verify_api_key),
) -> GenerateSummaryResponse:
    """
    Generate a release summary from git commit information.

    Uses an LLM agent to analyze commit messages and generate:
    - Bilingual release notes (short summary)
    - Detailed changelog in Markdown format
    - Structured changelog entries for each commit

    Args:
        request: GenerateSummaryRequest containing:
            - version: Target version number
            - commits: List of commits to process
            - date: Optional release date
            - author_username: Author for database record
            - save_to_db: Whether to persist results
        _: API key for authentication (injected by dependency).

    Returns:
        GenerateSummaryResponse: Generated summary with bilingual content
                                and structured changelogs.

    Raises:
        HTTPException: 500 if summary generation fails.

    Example Request:
        ```json
        {
            "version": "0.18.0",
            "commits": [
                {
                    "hash": "73b549f",
                    "message": "feat(about): add bug report dialog"
                },
                {
                    "hash": "b9f3b18",
                    "message": "fix(ui): resolve layout issue"
                }
            ],
            "date": "2024-01-05",
            "author_username": "silan",
            "save_to_db": true
        }
        ```
    """
    try:
        # Convert request commits to internal CommitInfo format
        commits = [
            CommitInfo(
                hash=c.hash,
                message=c.message,
                author=c.author,
                date=c.date,
            )
            for c in request.commits
        ]

        # Create agent and generate summary
        agent = create_summary_agent()
        summary = agent.generate_summary(
            version=request.version,
            commits=commits,
            date=request.date,
        )

        # Save to database if requested
        saved = False
        if request.save_to_db:
            try:
                agent.save_to_database(summary, request.author_username)
                saved = True
            except Exception as e:
                # Log error but don't fail the request
                return GenerateSummaryResponse(
                    success=True,
                    version=summary.version,
                    date=summary.date,
                    notes=summary.notes,
                    detail=summary.detail,
                    changelogs=[
                        ChangelogOutput(
                            type=cl.get("type", "improve"),
                            title=cl.get("title", {}),
                            detail=cl.get("detail"),
                            commit_hash=cl.get("commit_hash"),
                        )
                        for cl in summary.changelogs
                    ],
                    saved_to_db=False,
                    message=f"Summary generated but failed to save: {str(e)}",
                )

        return GenerateSummaryResponse(
            success=True,
            version=summary.version,
            date=summary.date,
            notes=summary.notes,
            detail=summary.detail,
            changelogs=[
                ChangelogOutput(
                    type=cl.get("type", "improve"),
                    title=cl.get("title", {}),
                    detail=cl.get("detail"),
                    commit_hash=cl.get("commit_hash"),
                )
                for cl in summary.changelogs
            ],
            saved_to_db=saved,
            message="Summary generated and saved to database" if saved else "Summary generated (not saved)",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}",
        )


@router.post("/preview", response_model=GenerateSummaryResponse)
def preview_summary(
    request: GenerateSummaryRequest,
    _: str = Depends(verify_api_key),
) -> GenerateSummaryResponse:
    """
    Preview a release summary without saving to database.

    Identical to /generate endpoint but always skips database
    persistence. Useful for reviewing generated content before
    committing to storage.

    Args:
        request: GenerateSummaryRequest (save_to_db is ignored).
        _: API key for authentication (injected by dependency).

    Returns:
        GenerateSummaryResponse: Generated summary (not saved).

    Raises:
        HTTPException: 500 if preview generation fails.

    Note:
        The save_to_db field in the request is ignored; preview
        mode never persists data.
    """
    # Force save_to_db to False for preview mode
    request.save_to_db = False

    try:
        commits = [
            CommitInfo(
                hash=c.hash,
                message=c.message,
                author=c.author,
                date=c.date,
            )
            for c in request.commits
        ]

        agent = create_summary_agent()
        summary = agent.generate_summary(
            version=request.version,
            commits=commits,
            date=request.date,
        )

        return GenerateSummaryResponse(
            success=True,
            version=summary.version,
            date=summary.date,
            notes=summary.notes,
            detail=summary.detail,
            changelogs=[
                ChangelogOutput(
                    type=cl.get("type", "improve"),
                    title=cl.get("title", {}),
                    detail=cl.get("detail"),
                    commit_hash=cl.get("commit_hash"),
                )
                for cl in summary.changelogs
            ],
            saved_to_db=False,
            message="Preview only - not saved to database",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate preview: {str(e)}",
        )
