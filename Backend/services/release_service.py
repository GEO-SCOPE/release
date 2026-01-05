# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Release Service

This module provides the business logic for managing software releases
in the GEO-SCOPE Release Server. It handles all CRUD operations for
releases including version management, changelog entries, and author
associations.

Key Features:
    - Create, read, update, delete release versions
    - Multi-language content support (notes and details)
    - Changelog entry management
    - Author association
    - Version sorting and comparison

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import logging
from typing import Optional, List, Dict
from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import selectinload

from core.database import session_scope
from models.entities import Release, Build, ChangelogEntry, Author
from services.base_service import BaseService
from utils.version import version_tuple

logger = logging.getLogger(__name__)


class ReleaseService(BaseService[Release]):
    """
    Release management service.

    Handles all business operations related to software releases including
    version management, changelog entries, and author associations.
    """

    def __init__(self):
        """Initialize the release service."""
        super().__init__(Release)

    def _eager_load_options(self):
        """
        Get SQLAlchemy eager loading options for releases.

        Returns:
            list: List of selectinload options for related entities
        """
        return [
            selectinload(Release.builds),
            selectinload(Release.changelogs).selectinload(ChangelogEntry.author),
            selectinload(Release.author),
        ]

    def _expunge_release(self, session, release: Release) -> None:
        """
        Detach a release and all its related objects from the session.

        Args:
            session: SQLAlchemy session
            release: Release entity to detach
        """
        self._safe_expunge(session, release)
        for build in release.builds:
            self._safe_expunge(session, build)
        for changelog in release.changelogs:
            self._safe_expunge(session, changelog)
            if changelog.author:
                self._safe_expunge(session, changelog.author)
        if release.author:
            self._safe_expunge(session, release.author)

    def get_latest(self, include_prerelease: bool = False) -> Optional[Release]:
        """
        Get the latest active release version.

        Retrieves the highest version number release that is marked as active.
        Optionally includes prerelease versions.

        Args:
            include_prerelease: Whether to include prerelease versions

        Returns:
            Release: The latest release, or None if no releases exist
        """
        with session_scope() as session:
            query = (
                session.query(Release)
                .options(*self._eager_load_options())
                .filter(Release.is_active == True)
            )
            if not include_prerelease:
                query = query.filter(Release.is_prerelease == False)
            releases = query.all()

            if not releases:
                return None

            # Sort by version number
            sorted_releases = sorted(
                releases,
                key=lambda r: version_tuple(r.version),
                reverse=True
            )
            latest = sorted_releases[0]
            self._expunge_release(session, latest)
            return latest

    def get_by_version(self, version: str) -> Optional[Release]:
        """
        Get a specific release by version number.

        Args:
            version: The version string to look up

        Returns:
            Release: The release if found, None otherwise
        """
        with session_scope() as session:
            release = (
                session.query(Release)
                .options(*self._eager_load_options())
                .filter(Release.version == version)
                .first()
            )
            if release:
                self._expunge_release(session, release)
            return release

    def get_all(self, active_only: bool = False) -> List[Release]:
        """
        Get all release versions.

        Args:
            active_only: If True, only return active releases

        Returns:
            list: List of Release entities ordered by creation date (newest first)
        """
        with session_scope() as session:
            query = (
                session.query(Release)
                .options(*self._eager_load_options())
            )
            if active_only:
                query = query.filter(Release.is_active == True)
            releases = query.order_by(desc(Release.created_at)).all()
            for release in releases:
                self._expunge_release(session, release)
            return releases

    def create(
        self,
        version: str,
        notes: Optional[Dict[str, str]] = None,
        detail: Optional[Dict[str, str]] = None,
        author_username: Optional[str] = None,
        is_critical: bool = False,
        is_prerelease: bool = False,
        min_version: Optional[str] = None,
    ) -> Release:
        """
        Create a new release version.

        Args:
            version: Semantic version string (e.g., "1.0.0")
            notes: Multi-language short release notes
            detail: Multi-language detailed changelog (Markdown)
            author_username: Username of the release author
            is_critical: Whether this is a critical/forced update
            is_prerelease: Whether this is a prerelease version
            min_version: Minimum compatible version

        Returns:
            Release: The created release entity

        Raises:
            ValueError: If the version already exists
        """
        with session_scope() as session:
            # Check if version already exists
            existing = session.query(Release).filter(Release.version == version).first()
            if existing:
                raise ValueError(f"Release {version} already exists")

            # Find author
            author_id = None
            author = None
            if author_username:
                author = session.query(Author).filter(Author.username == author_username).first()
                if author:
                    author_id = author.id

            release = Release(
                version=version,
                notes=notes or {},
                detail=detail or {},
                author_id=author_id,
                is_critical=is_critical,
                is_prerelease=is_prerelease,
                min_version=min_version,
            )
            session.add(release)
            session.flush()
            session.expunge(release)
            if author:
                session.expunge(author)
                release.author = author
            release.builds = []
            release.changelogs = []
            logger.info(f"Created release {version}")
            return release

    def update(self, version: str, **kwargs) -> Optional[Release]:
        """
        Update an existing release version.

        Notes and detail fields are merged with existing content rather
        than replaced entirely.

        Args:
            version: The version to update
            **kwargs: Fields to update (notes, detail, author_username, etc.)

        Returns:
            Release: The updated release, or None if not found
        """
        with session_scope() as session:
            release = (
                session.query(Release)
                .options(*self._eager_load_options())
                .filter(Release.version == version)
                .first()
            )
            if not release:
                return None

            # Handle notes and detail updates (merge rather than replace)
            if "notes" in kwargs and kwargs["notes"] is not None:
                current_notes = release.notes or {}
                current_notes.update(kwargs.pop("notes"))
                release.notes = current_notes

            if "detail" in kwargs and kwargs["detail"] is not None:
                current_detail = release.detail or {}
                current_detail.update(kwargs.pop("detail"))
                release.detail = current_detail

            # Handle author_username update
            if "author_username" in kwargs and kwargs["author_username"] is not None:
                author_username = kwargs.pop("author_username")
                author = session.query(Author).filter(Author.username == author_username).first()
                if author:
                    release.author_id = author.id

            # Update other fields
            for key, value in kwargs.items():
                if value is not None and hasattr(release, key):
                    setattr(release, key, value)

            release.updated_at = datetime.now(timezone.utc)
            session.flush()
            self._expunge_release(session, release)
            logger.info(f"Updated release {version}")
            return release

    def delete(self, version: str) -> bool:
        """
        Delete a release version.

        Args:
            version: The version to delete

        Returns:
            bool: True if deleted, False if not found
        """
        with session_scope() as session:
            release = session.query(Release).filter(Release.version == version).first()
            if not release:
                return False
            session.delete(release)
            logger.info(f"Deleted release {version}")
            return True

    def add_changelog_entry(
        self,
        version: str,
        type: str,
        title: Dict[str, str],
        detail: Optional[Dict[str, str]] = None,
        issue_url: Optional[str] = None,
        pr_url: Optional[str] = None,
        commit_hash: Optional[str] = None,
        author_username: Optional[str] = None,
    ) -> Optional[ChangelogEntry]:
        """
        Add a changelog entry to a release.

        Args:
            version: The release version to add the entry to
            type: Entry type (feature, improve, fix, breaking, security, deprecated)
            title: Multi-language title
            detail: Multi-language detail (Markdown)
            issue_url: GitHub Issue URL
            pr_url: GitHub Pull Request URL
            commit_hash: Git commit hash
            author_username: Username of the entry author

        Returns:
            ChangelogEntry: The created entry, or None if release not found
        """
        with session_scope() as session:
            release = session.query(Release).filter(Release.version == version).first()
            if not release:
                return None

            # Find author
            author_id = None
            author = None
            if author_username:
                author = session.query(Author).filter(Author.username == author_username).first()
                if author:
                    author_id = author.id

            # Get current max order
            max_order = session.query(ChangelogEntry).filter(
                ChangelogEntry.release_id == release.id
            ).count()

            entry = ChangelogEntry(
                release_id=release.id,
                type=type,
                title=title,
                detail=detail or {},
                issue_url=issue_url,
                pr_url=pr_url,
                commit_hash=commit_hash,
                author_id=author_id,
                order=max_order,
            )
            session.add(entry)
            session.flush()
            session.expunge(entry)
            if author:
                session.expunge(author)
                entry.author = author
            logger.info(f"Added changelog entry for {version}")
            return entry

    def get_changelog(self, limit: int = 10, locale: str = "en") -> List[dict]:
        """
        Get changelog data for display.

        Returns a list of releases with their changelog entries,
        sorted by version number (newest first).

        Args:
            limit: Maximum number of releases to return
            locale: Language code for content (used for fallback)

        Returns:
            list: List of release dictionaries with changelog data
        """
        releases = self.get_all(active_only=False)

        # Sort by version number
        sorted_releases = sorted(
            releases,
            key=lambda r: version_tuple(r.version),
            reverse=True
        )[:limit]

        return [
            {
                "version": r.version,
                "pub_date": r.pub_date.isoformat() + "Z" if r.pub_date else None,
                "notes": r.notes or {},
                "detail": r.detail or {},
                "is_critical": r.is_critical,
                "is_prerelease": r.is_prerelease,
                "is_active": r.is_active,
                "author": {
                    "username": r.author.username,
                    "name": r.author.name,
                    "avatar_url": r.author.avatar_url,
                    "github_url": r.author.github_url,
                } if r.author else None,
                "changelogs": [
                    {
                        "type": c.type,
                        "title": c.title or {},
                        "detail": c.detail or {},
                        "commit_hash": c.commit_hash,
                        "issue_url": c.issue_url,
                        "pr_url": c.pr_url,
                        "author": {
                            "username": c.author.username,
                            "name": c.author.name,
                            "avatar_url": c.author.avatar_url,
                            "github_url": c.author.github_url,
                        } if c.author else None,
                    }
                    for c in sorted(r.changelogs, key=lambda x: x.order)
                ] if hasattr(r, 'changelogs') and r.changelogs else [],
            }
            for r in sorted_releases
        ]
