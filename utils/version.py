# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/version.py
Description: Version number utilities module.
             Provides semantic versioning parsing, comparison, and formatting
             functions for managing software release versions.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import re
from typing import Tuple, Optional


def version_tuple(version: str) -> Tuple[int, ...]:
    """
    Convert version string to tuple for comparison.

    Parses a version string and extracts the numeric components as a tuple,
    which can be used for version comparison operations.

    Args:
        version: Version string (e.g., "1.2.3", "v1.2.3", "1.2.3-beta").

    Returns:
        Version tuple (e.g., (1, 2, 3)).
    """
    try:
        # Remove prefix 'v' and suffix (e.g., -beta, -rc1)
        clean_version = version.lstrip("v").split("-")[0]
        parts = clean_version.split(".")
        return tuple(int(p) for p in parts)
    except (ValueError, AttributeError):
        return (0, 0, 0)


def compare_versions(v1: str, v2: str) -> int:
    """
    Compare two version numbers.

    Performs a semantic comparison between two version strings.

    Args:
        v1: First version number.
        v2: Second version number.

    Returns:
        -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
    """
    t1 = version_tuple(v1)
    t2 = version_tuple(v2)

    if t1 < t2:
        return -1
    elif t1 > t2:
        return 1
    return 0


def is_newer_version(current: str, latest: str) -> bool:
    """
    Check if a newer version is available.

    Determines whether the latest version is newer than the current version.

    Args:
        current: Current version number.
        latest: Latest available version number.

    Returns:
        True if latest > current, False otherwise.
    """
    return compare_versions(current, latest) < 0


def parse_version(version: str) -> Optional[dict]:
    """
    Parse semantic version number into components.

    Extracts major, minor, patch, prerelease, and build metadata from
    a semantic version string.

    Args:
        version: Version string to parse.

    Returns:
        Dictionary with keys: major, minor, patch, prerelease, build.
        Returns None if parsing fails.
    """
    # Semantic version regular expression
    pattern = r'^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$'
    match = re.match(pattern, version)

    if not match:
        return None

    return {
        "major": int(match.group(1)),
        "minor": int(match.group(2)),
        "patch": int(match.group(3)),
        "prerelease": match.group(4),
        "build": match.group(5),
    }


def format_version(major: int, minor: int, patch: int,
                   prerelease: Optional[str] = None,
                   build: Optional[str] = None) -> str:
    """
    Format version components into a version string.

    Constructs a semantic version string from individual components.

    Args:
        major: Major version number.
        minor: Minor version number.
        patch: Patch version number.
        prerelease: Prerelease label (optional).
        build: Build metadata (optional).

    Returns:
        Formatted version string (e.g., "1.2.3-beta+001").
    """
    version = f"{major}.{minor}.{patch}"

    if prerelease:
        version += f"-{prerelease}"

    if build:
        version += f"+{build}"

    return version
