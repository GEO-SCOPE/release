# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Author Entity Model

This module defines the Author entity for storing information about
release authors and contributors in the GEO-SCOPE Release Server.

The Author model supports:
    - Basic profile information (name, username, email)
    - External links (GitHub, website, avatar)
    - Multi-language biography (JSON format)
    - Role-based classification (maintainer, contributor, bot)

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship

from core.database import Base
from models.entities.base import generate_id, utc_now


class Author(Base):
    """
    Author/Contributor entity model.

    Represents an author or contributor who can be associated with
    releases and changelog entries.

    Attributes:
        id (str): Unique identifier (8-character short ID)
        name (str): Display name of the author
        username (str): Unique username identifier (indexed)
        email (str): Contact email address (optional)
        avatar_url (str): URL to avatar image (optional)
        github_url (str): GitHub profile URL (optional)
        website_url (str): Personal website URL (optional)
        bio (dict): Multi-language biography JSON {"en": "...", "zh": "..."}
        role (str): Role type - "maintainer", "contributor", or "bot"
        is_active (bool): Whether the author is currently active
        created_at (datetime): Record creation timestamp
        updated_at (datetime): Last update timestamp
        releases (list): Relationship to Release entities
    """
    __tablename__ = "authors"

    id = Column(String(36), primary_key=True, default=generate_id)

    # Basic information
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(200), nullable=True)

    # External links
    avatar_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)

    # Multi-language biography (JSON format)
    bio = Column(JSON, default=dict)  # {"en": "...", "zh": "...", ...}

    # Role: maintainer, contributor, bot
    role = Column(String(20), default="contributor")

    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    releases = relationship("Release", back_populates="author")

    def get_bio(self, locale: str = "en") -> str:
        """
        Get biography text for the specified locale.

        Falls back to English if the requested locale is not available.

        Args:
            locale: Language code (e.g., "en", "zh", "ja")

        Returns:
            str: Biography text in the requested language, or empty string
        """
        bio = self.bio or {}
        return bio.get(locale) or bio.get("en") or ""

    def to_dict(self) -> dict:
        """
        Convert entity to dictionary representation.

        Returns:
            dict: Dictionary containing all author fields
        """
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "github_url": self.github_url,
            "website_url": self.website_url,
            "bio": self.bio or {},
            "role": self.role,
        }
