# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Release Pydantic Schemas

This module provides Pydantic schemas for release/version
related API operations in the GEO-SCOPE Release Server.

Schemas:
    - ReleaseInfo: Complete release information response
    - ReleaseCreateRequest: Release creation request
    - ReleaseUpdateRequest: Release update request
    - ReleaseListResponse: Paginated release list response
    - ReleaseResponse: Single release detail response

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from models.schemas.author import AuthorInfo
from models.schemas.build import PlatformBuildInfo
from models.schemas.changelog import ChangelogEntryInfo


class ReleaseInfo(BaseModel):
    """
    Complete release information schema.

    Used for API responses containing full release details
    including builds and changelog entries.

    Attributes:
        id (str): Unique identifier
        version (str): Semantic version string
        pub_date (str): Publication date in ISO 8601 format
        notes (dict): Multi-language short release notes
        detail (dict): Multi-language detailed changelog (Markdown)
        author (AuthorInfo): Associated author information
        is_active (bool): Whether release is publicly available
        is_critical (bool): Whether this is a critical/forced update
        is_prerelease (bool): Whether this is a prerelease version
        min_version (str): Minimum compatible version
        download_count (int): Total download count
        created_at (str): Creation timestamp
        updated_at (str): Last update timestamp
        builds (list): List of platform builds
        changelogs (list): List of changelog entries
    """
    id: Optional[str] = None
    version: str
    pub_date: Optional[str] = None

    # Multi-language content (JSON: {"en": "...", "zh": "...", "ja": "...", ...})
    notes: Dict[str, str] = Field(default_factory=dict)  # Short release notes
    detail: Dict[str, str] = Field(default_factory=dict)  # Detailed changelog (Markdown)

    # Author information
    author: Optional[AuthorInfo] = None

    # Status flags
    is_active: bool = True
    is_critical: bool = False
    is_prerelease: bool = False
    min_version: Optional[str] = None

    # Statistics
    download_count: int = 0

    # Timestamps
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # Relationships
    builds: List[PlatformBuildInfo] = Field(default_factory=list)
    changelogs: List[ChangelogEntryInfo] = Field(default_factory=list)

    class Config:
        from_attributes = True

    @classmethod
    def from_db(cls, release) -> "ReleaseInfo":
        """
        Create Pydantic model from database entity.

        Args:
            release: SQLAlchemy Release entity

        Returns:
            ReleaseInfo: Pydantic schema instance
        """
        # Create AuthorInfo from associated Author entity
        author = None
        if release.author:
            author = AuthorInfo(
                id=release.author.id,
                name=release.author.name,
                username=release.author.username,
                email=release.author.email,
                avatar_url=release.author.avatar_url,
                github_url=release.author.github_url,
                website_url=release.author.website_url,
                bio=release.author.bio or {},
                role=release.author.role,
            )

        return cls(
            id=release.id,
            version=release.version,
            pub_date=release.pub_date.isoformat() + "Z" if release.pub_date else None,
            notes=release.notes or {},
            detail=release.detail or {},
            author=author,
            is_active=release.is_active,
            is_critical=release.is_critical,
            is_prerelease=release.is_prerelease,
            min_version=release.min_version,
            download_count=release.download_count or 0,
            created_at=release.created_at.isoformat() if release.created_at else None,
            updated_at=release.updated_at.isoformat() if release.updated_at else None,
            builds=[PlatformBuildInfo.model_validate(b) for b in release.builds],
            changelogs=[ChangelogEntryInfo.from_db(c) for c in getattr(release, 'changelogs', [])],
        )


class ReleaseCreateRequest(BaseModel):
    """
    Release creation request schema.

    Used for creating new release versions with multi-language
    content support.

    Attributes:
        version (str): Semantic version string
        notes (dict): Multi-language short notes
        detail (dict): Multi-language detailed changelog
        author (dict): Legacy author format (deprecated)
        author_username (str): Username to associate with release
        is_critical (bool): Critical update flag
        is_prerelease (bool): Prerelease flag
        min_version (str): Minimum compatible version
    """
    version: str
    notes: Dict[str, str] = Field(default_factory=dict)
    detail: Dict[str, str] = Field(default_factory=dict)
    author: Optional[Dict[str, str]] = None  # Legacy format compatibility
    author_username: Optional[str] = None  # New format: reference existing author
    is_critical: bool = False
    is_prerelease: bool = False
    min_version: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "version": "0.2.0",
                "notes": {
                    "en": "- New: Auto update feature",
                    "zh": "- New feature: Auto update",
                    "ja": "- New feature: Auto update"
                },
                "detail": {
                    "en": "## New Features\n\n### Auto Update\nDetailed description...",
                    "zh": "## New Features\n\n### Auto Update\nDetailed description..."
                },
                "author_username": "silan",
                "is_critical": False,
                "is_prerelease": False
            }
        }


class ReleaseUpdateRequest(BaseModel):
    """
    Release update request schema.

    Used for partial updates to existing releases.
    Note: notes and detail are merged with existing content.

    Attributes:
        notes (dict): Multi-language notes to merge
        detail (dict): Multi-language detail to merge
        author_username (str): Change associated author
        is_active (bool): Active status flag
        is_critical (bool): Critical update flag
        is_prerelease (bool): Prerelease flag
        min_version (str): Minimum compatible version
    """
    notes: Optional[Dict[str, str]] = None  # Merged with existing notes
    detail: Optional[Dict[str, str]] = None  # Merged with existing detail
    author_username: Optional[str] = None  # Change author
    is_active: Optional[bool] = None
    is_critical: Optional[bool] = None
    is_prerelease: Optional[bool] = None
    min_version: Optional[str] = None


class ReleaseListResponse(BaseModel):
    """
    Paginated release list response schema.

    Attributes:
        total (int): Total number of releases
        releases (list): List of ReleaseInfo objects
    """
    total: int
    releases: List[ReleaseInfo]


class ReleaseResponse(BaseModel):
    """
    Single release detail response schema.

    Attributes:
        release (ReleaseInfo): Release information
    """
    release: ReleaseInfo
