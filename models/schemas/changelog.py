# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Changelog Pydantic Schemas

This module provides Pydantic schemas for changelog entry
related API operations in the GEO-SCOPE Release Server.

Schemas:
    - ChangelogEntryInfo: Changelog entry information response
    - ChangelogEntryRequest: Changelog entry creation request
    - ChangelogResponse: Changelog list response

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from typing import Optional, List, Dict
from pydantic import BaseModel

from models.schemas.author import ChangelogEntryAuthor


class ChangelogEntryInfo(BaseModel):
    """
    Changelog entry information schema.

    Represents a single changelog entry with multi-language
    content and reference links.

    Attributes:
        id (str): Unique identifier
        type (str): Change type - "feature", "improve", "fix",
                    "breaking", "security", or "deprecated"
        title (dict): Multi-language title {"en": "...", "zh": "..."}
        detail (dict): Multi-language detail (Markdown format)
        issue_url (str): GitHub Issue URL
        pr_url (str): GitHub Pull Request URL
        commit_hash (str): Git commit hash
        author (ChangelogEntryAuthor): Entry author information
    """
    id: Optional[str] = None
    type: str = "improve"  # feature, improve, fix, breaking, security, deprecated
    title: Dict[str, str] = {}  # Title {"en": "...", "zh": "..."}
    detail: Dict[str, str] = {}  # Detail (Markdown)
    issue_url: Optional[str] = None
    pr_url: Optional[str] = None
    commit_hash: Optional[str] = None
    author: Optional[ChangelogEntryAuthor] = None  # Entry author

    class Config:
        from_attributes = True

    @classmethod
    def from_db(cls, entry) -> "ChangelogEntryInfo":
        """
        Create Pydantic model from database entity.

        Args:
            entry: SQLAlchemy ChangelogEntry entity

        Returns:
            ChangelogEntryInfo: Pydantic schema instance
        """
        author = None
        if entry.author:
            author = ChangelogEntryAuthor(
                username=entry.author.username,
                name=entry.author.name,
                avatar_url=entry.author.avatar_url,
                github_url=entry.author.github_url,
            )

        return cls(
            id=entry.id,
            type=entry.type,
            title=entry.title or {},
            detail=entry.detail or {},
            issue_url=entry.issue_url,
            pr_url=entry.pr_url,
            commit_hash=entry.commit_hash,
            author=author,
        )


class ChangelogEntryRequest(BaseModel):
    """
    Changelog entry creation request schema.

    Used for adding new changelog entries to a release.

    Attributes:
        type (str): Change type
        title (dict): Multi-language title (required)
        detail (dict): Multi-language detail (optional)
        issue_url (str): GitHub Issue URL
        pr_url (str): GitHub Pull Request URL
        commit_hash (str): Git commit hash
        author_username (str): Username to associate with entry
    """
    type: str = "improve"  # feature, improve, fix, breaking, security, deprecated
    title: Dict[str, str]  # Title {"en": "...", "zh": "..."}
    detail: Optional[Dict[str, str]] = None  # Detail (Markdown)
    issue_url: Optional[str] = None
    pr_url: Optional[str] = None
    commit_hash: Optional[str] = None
    author_username: Optional[str] = None  # Reference existing author

    class Config:
        json_schema_extra = {
            "example": {
                "type": "feature",
                "title": {
                    "en": "Add auto-update feature",
                    "zh": "Add auto-update feature",
                },
                "detail": {
                    "en": "- Integrated Tauri updater plugin\n- Added beta channel support",
                    "zh": "- Integrated Tauri updater plugin\n- Added beta channel support",
                },
                "pr_url": "https://github.com/org/repo/pull/123",
                "author_username": "silan"
            }
        }


class ChangelogResponse(BaseModel):
    """
    Changelog list response schema.

    Returns a list of releases with their changelog information.

    Attributes:
        total (int): Total number of releases with changelogs
        releases (list): Simplified release information list
    """
    total: int
    releases: List[dict]  # Simplified release info list
