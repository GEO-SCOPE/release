# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Build Service

This module provides the business logic for managing platform-specific
build artifacts in the GEO-SCOPE Release Server. It handles build
registration, updates, and download tracking.

Key Features:
    - Add/update platform builds for releases
    - Remove builds from releases
    - Get specific builds by platform/architecture
    - Track download counts

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import logging
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.orm import selectinload

from core.database import session_scope
from models.entities import Release, Build, ChangelogEntry
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class BuildService(BaseService[Build]):
    """
    Build management service.

    Handles all business operations related to platform-specific
    build artifacts including registration, updates, and removal.
    """

    def __init__(self):
        """Initialize the build service."""
        super().__init__(Build)

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

    def add_build(
        self,
        version: str,
        target: str,
        arch: str,
        url: str,
        signature: str = "",
        size: Optional[int] = None,
        sha256: Optional[str] = None,
    ) -> Optional[Release]:
        """
        Add or update a platform build for a release.

        If a build for the same platform/architecture already exists,
        it will be updated with the new information.

        Args:
            version: The release version
            target: Target platform (darwin, windows, linux)
            arch: CPU architecture (x86_64, aarch64)
            url: Download URL for the build
            signature: Cryptographic signature for verification
            size: File size in bytes
            sha256: SHA256 checksum

        Returns:
            Release: The updated release, or None if release not found
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

            # Check if build for same platform already exists, replace it
            existing = session.query(Build).filter(
                Build.release_id == release.id,
                Build.target == target,
                Build.arch == arch
            ).first()

            if existing:
                existing.url = url
                existing.signature = signature
                existing.size = size
                existing.sha256 = sha256
                logger.info(f"Updated build {target}/{arch} for {version}")
            else:
                build = Build(
                    release_id=release.id,
                    target=target,
                    arch=arch,
                    url=url,
                    signature=signature,
                    size=size,
                    sha256=sha256,
                )
                session.add(build)
                logger.info(f"Added build {target}/{arch} for {version}")

            release.updated_at = datetime.now(timezone.utc)
            session.flush()
            session.refresh(release)
            self._expunge_release(session, release)
            return release

    def remove_build(self, version: str, target: str, arch: str) -> Optional[Release]:
        """
        Remove a platform build from a release.

        Args:
            version: The release version
            target: Target platform (darwin, windows, linux)
            arch: CPU architecture (x86_64, aarch64)

        Returns:
            Release: The updated release, or None if release not found
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

            build = session.query(Build).filter(
                Build.release_id == release.id,
                Build.target == target,
                Build.arch == arch
            ).first()

            if build:
                session.delete(build)
                release.updated_at = datetime.now(timezone.utc)
                logger.info(f"Removed build {target}/{arch} for {version}")

            session.flush()
            session.refresh(release)
            self._expunge_release(session, release)
            return release

    def get_build(self, version: str, target: str, arch: str) -> Optional[Build]:
        """
        Get a specific build by version, platform, and architecture.

        Args:
            version: The release version
            target: Target platform (darwin, windows, linux)
            arch: CPU architecture (x86_64, aarch64)

        Returns:
            Build: The build if found, None otherwise
        """
        with session_scope() as session:
            release = session.query(Release).filter(Release.version == version).first()
            if not release:
                return None

            build = session.query(Build).filter(
                Build.release_id == release.id,
                Build.target == target,
                Build.arch == arch
            ).first()

            if build:
                self._safe_expunge(session, build)
            return build

    def increment_download_count(self, build_id: str) -> bool:
        """
        Increment the download count for a build.

        Args:
            build_id: The build ID

        Returns:
            bool: True if successful, False if build not found
        """
        with session_scope() as session:
            build = session.query(Build).filter(Build.id == build_id).first()
            if not build:
                return False
            build.download_count = (build.download_count or 0) + 1
            return True
