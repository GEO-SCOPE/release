# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Update Service

This module provides the business logic for version update checking
in the GEO-SCOPE Release Server. It implements the Tauri auto-updater
compatible endpoints for desktop application updates.

Key Features:
    - Check for available updates (Tauri compatible)
    - Get latest version information
    - Beta channel access validation
    - Changelog retrieval

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import logging
from typing import Optional

from core.config import settings
from services.release_service import ReleaseService
from utils.version import compare_versions

logger = logging.getLogger(__name__)


class UpdateService:
    """
    Update checking service.

    Provides version update checking functionality compatible with
    the Tauri auto-updater plugin.
    """

    def __init__(self):
        """Initialize the update service."""
        self.release_service = ReleaseService()

    def check_update(
        self,
        current_version: str,
        target: str,
        arch: str,
        locale: str = "en",
        include_prerelease: bool = False,
    ) -> Optional[dict]:
        """
        Check if an update is available.

        Compares the current version with the latest available release
        and returns update information if a newer version exists.

        Args:
            current_version: Current application version
            target: Target platform (darwin, windows, linux)
            arch: CPU architecture (x86_64, aarch64)
            locale: Language code for release notes
            include_prerelease: Whether to include prerelease versions (beta channel)

        Returns:
            dict: Tauri updater format response if update available, None otherwise
                - version: New version string
                - pub_date: Publication date (ISO 8601)
                - url: Download URL
                - signature: Cryptographic signature
                - notes: Release notes in requested locale
        """
        latest = self.release_service.get_latest(include_prerelease=include_prerelease)
        if not latest:
            return None

        # Version comparison
        if compare_versions(current_version, latest.version) >= 0:
            return None

        # Get matching platform build
        build = None
        for b in latest.builds:
            if b.target == target and b.arch == arch:
                build = b
                break

        if not build:
            return None

        return {
            "version": latest.version,
            "pub_date": latest.pub_date.isoformat() + "Z" if latest.pub_date else None,
            "url": build.url,
            "signature": build.signature,
            "notes": latest.get_notes(locale),
        }

    def get_latest_version_info(self, include_prerelease: bool = False) -> Optional[dict]:
        """
        Get information about the latest version.

        Args:
            include_prerelease: Whether to include prerelease versions

        Returns:
            dict: Latest version information, or None if no releases exist
                - version: Version string
                - pub_date: Publication date (ISO 8601)
                - notes: Multi-language release notes
                - detail: Multi-language detailed changelog
                - is_critical: Whether this is a critical update
                - is_prerelease: Whether this is a prerelease
                - platforms: List of available platform/architecture combinations
        """
        latest = self.release_service.get_latest(include_prerelease=include_prerelease)
        if not latest:
            return None

        return {
            "version": latest.version,
            "pub_date": latest.pub_date.isoformat() + "Z" if latest.pub_date else None,
            "notes": latest.notes or {},
            "detail": latest.detail or {},
            "is_critical": latest.is_critical,
            "is_prerelease": latest.is_prerelease,
            "platforms": [
                {"target": b.target, "arch": b.arch}
                for b in latest.builds
            ]
        }

    def validate_beta_key(self, beta_key: str) -> bool:
        """
        Validate a beta access key.

        Args:
            beta_key: The beta access key to validate

        Returns:
            bool: True if the key is valid, False otherwise
        """
        if not beta_key:
            return False
        return beta_key in settings.BETA_ACCESS_KEYS

    def get_changelog(self, limit: int = 10, locale: str = "en") -> dict:
        """
        Get the changelog for display.

        Args:
            limit: Maximum number of releases to include
            locale: Language code for content

        Returns:
            dict: Changelog data
                - total: Number of releases
                - releases: List of release changelog data
        """
        changelog = self.release_service.get_changelog(limit=limit, locale=locale)
        return {
            "total": len(changelog),
            "releases": changelog
        }
