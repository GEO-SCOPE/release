# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Release Entity Model

This module defines the Release entity for storing version release
information in the GEO-SCOPE Release Server.

The Release model supports:
    - Semantic versioning
    - Multi-language release notes and details (JSON format)
    - Release status flags (active, critical, prerelease)
    - Author association
    - Platform builds and changelog relationships

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from core.database import Base
from models.entities.base import generate_id, utc_now


class Release(Base):
    """
    Version Release entity model.

    Represents a software release version with multi-language content,
    platform builds, and changelog entries.

    Attributes:
        id (str): Unique identifier (8-character short ID)
        version (str): Semantic version string (e.g., "1.0.0")
        pub_date (datetime): Publication date
        notes (dict): Multi-language short release notes JSON
        detail (dict): Multi-language detailed changelog JSON (Markdown)
        is_active (bool): Whether the release is publicly available
        is_critical (bool): Whether this is a critical/forced update
        is_prerelease (bool): Whether this is a prerelease version
        min_version (str): Minimum compatible version (optional)
        author_id (str): Foreign key to Author entity
        download_count (int): Total download count
        created_at (datetime): Record creation timestamp
        updated_at (datetime): Last update timestamp
        author (Author): Relationship to Author entity
        builds (list): Relationship to Build entities
        changelogs (list): Relationship to ChangelogEntry entities
    """
    __tablename__ = "releases"

    id = Column(String(36), primary_key=True, default=generate_id)
    version = Column(String(20), unique=True, nullable=False, index=True)
    pub_date = Column(DateTime, default=utc_now)

    # Multi-language content (JSON format: {"en": "...", "zh": "...", "ja": "...", ...})
    # notes: Short changelog (for list display)
    # detail: Detailed changelog (Markdown format, for detail page)
    notes = Column(JSON, default=dict)
    detail = Column(JSON, default=dict)

    # Release status
    is_active = Column(Boolean, default=True)
    is_critical = Column(Boolean, default=False)  # Critical update (forced)
    is_prerelease = Column(Boolean, default=False)  # Prerelease version
    min_version = Column(String(20), nullable=True)  # Minimum compatible version

    # Author (foreign key relationship)
    author_id = Column(String(36), ForeignKey("authors.id"), nullable=True)

    # Metadata
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    author = relationship("Author", back_populates="releases")
    builds = relationship("Build", back_populates="release", cascade="all, delete-orphan")
    changelogs = relationship("ChangelogEntry", back_populates="release", cascade="all, delete-orphan")

    def get_notes(self, locale: str = "en") -> str:
        """
        Get short release notes for the specified locale.

        Falls back to English, then to any available language.

        Args:
            locale: Language code (e.g., "en", "zh", "ja")

        Returns:
            str: Short release notes in the requested language
        """
        notes = self.notes or {}
        return notes.get(locale) or notes.get("en") or next(iter(notes.values()), "")

    def get_detail(self, locale: str = "en") -> str:
        """
        Get detailed changelog for the specified locale.

        Falls back to English, then to any available language.

        Args:
            locale: Language code (e.g., "en", "zh", "ja")

        Returns:
            str: Detailed changelog in Markdown format
        """
        detail = self.detail or {}
        return detail.get(locale) or detail.get("en") or next(iter(detail.values()), "")

    def to_dict(self, include_builds: bool = True, include_changelogs: bool = False) -> dict:
        """
        Convert entity to dictionary representation.

        Args:
            include_builds: Whether to include build artifacts
            include_changelogs: Whether to include changelog entries

        Returns:
            dict: Dictionary containing release data
        """
        data = {
            "id": self.id,
            "version": self.version,
            "pub_date": self.pub_date.isoformat() + "Z" if self.pub_date else None,
            "notes": self.notes or {},
            "detail": self.detail or {},
            "author": self.author.to_dict() if self.author else None,
            "is_active": self.is_active,
            "is_critical": self.is_critical,
            "is_prerelease": self.is_prerelease,
            "min_version": self.min_version,
            "download_count": self.download_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_builds:
            data["builds"] = [b.to_dict() for b in self.builds]
        if include_changelogs:
            data["changelogs"] = [c.to_dict() for c in self.changelogs]
        return data
