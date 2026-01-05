# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - ChangelogEntry Entity Model

This module defines the ChangelogEntry entity for storing fine-grained
changelog entries in the GEO-SCOPE Release Server.

The ChangelogEntry model supports:
    - Change type categorization (feature, improve, fix, etc.)
    - Multi-language titles and details (JSON format)
    - GitHub issue and PR linking
    - Git commit hash references
    - Per-entry author attribution

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from core.database import Base
from models.entities.base import generate_id, utc_now


class ChangelogEntry(Base):
    """
    Changelog Entry entity model.

    Represents a single changelog entry for fine-grained change tracking.
    Each release can have multiple changelog entries describing individual
    changes, features, or fixes.

    Attributes:
        id (str): Unique identifier (8-character short ID)
        release_id (str): Foreign key to Release entity
        type (str): Change type - "feature", "improve", "fix", "breaking",
                    "security", or "deprecated"
        title (dict): Multi-language title JSON {"en": "...", "zh": "..."}
        detail (dict): Multi-language detail JSON in Markdown (optional)
        issue_url (str): GitHub Issue URL (optional)
        pr_url (str): GitHub Pull Request URL (optional)
        commit_hash (str): Git commit hash (optional)
        author_id (str): Foreign key to Author entity (optional)
        order (int): Display order within the release
        created_at (datetime): Record creation timestamp
        release (Release): Relationship to parent Release entity
        author (Author): Relationship to Author entity
    """
    __tablename__ = "changelog_entries"

    id = Column(String(36), primary_key=True, default=generate_id)
    release_id = Column(String(36), ForeignKey("releases.id"), nullable=False)

    # Change type: feature, improve, fix, breaking, security, deprecated
    type = Column(String(20), nullable=False, default="improve")

    # Multi-language title (JSON format: {"en": "...", "zh": "...", ...})
    title = Column(JSON, nullable=False)

    # Multi-language detail (Markdown format, optional)
    detail = Column(JSON, nullable=True)

    # Reference links (optional)
    issue_url = Column(String(500), nullable=True)  # GitHub Issue link
    pr_url = Column(String(500), nullable=True)  # GitHub PR link
    commit_hash = Column(String(40), nullable=True)  # Git commit hash

    # Author (each commit may have a different author)
    author_id = Column(String(36), ForeignKey("authors.id"), nullable=True)

    # Ordering
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    release = relationship("Release", back_populates="changelogs")
    author = relationship("Author")

    def get_title(self, locale: str = "en") -> str:
        """
        Get title text for the specified locale.

        Falls back to English, then to any available language.

        Args:
            locale: Language code (e.g., "en", "zh", "ja")

        Returns:
            str: Title in the requested language
        """
        title = self.title or {}
        return title.get(locale) or title.get("en") or next(iter(title.values()), "")

    def get_detail(self, locale: str = "en") -> str:
        """
        Get detail text for the specified locale.

        Falls back to English, then to any available language.

        Args:
            locale: Language code (e.g., "en", "zh", "ja")

        Returns:
            str: Detail text in the requested language
        """
        detail = self.detail or {}
        return detail.get(locale) or detail.get("en") or next(iter(detail.values()), "")

    def to_dict(self) -> dict:
        """
        Convert entity to dictionary representation.

        Returns:
            dict: Dictionary containing all changelog entry fields
        """
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title or {},
            "detail": self.detail or {},
            "issue_url": self.issue_url,
            "pr_url": self.pr_url,
            "commit_hash": self.commit_hash,
            "author": self.author.to_dict() if self.author else None,
        }
