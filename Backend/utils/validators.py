# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/validators.py
Description: Data validation utilities module.
             Provides common validation functions for version numbers, platforms,
             architectures, emails, and URLs used throughout the application.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import re
from typing import Optional


# Supported platforms
VALID_PLATFORMS = {"darwin", "windows", "linux"}

# Supported architectures
VALID_ARCHITECTURES = {"x86_64", "aarch64", "arm64", "i686"}

# Version number regular expression pattern
VERSION_PATTERN = re.compile(r'^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?(?:\+[a-zA-Z0-9.]+)?$')


def validate_version(version: str) -> bool:
    """
    Validate version number format.

    Checks if the provided version string conforms to semantic versioning
    format (e.g., "1.2.3", "v1.2.3", "1.2.3-beta").

    Args:
        version: Version string to validate.

    Returns:
        True if the format is valid, False otherwise.
    """
    if not version:
        return False
    return bool(VERSION_PATTERN.match(version))


def validate_platform(platform: str) -> bool:
    """
    Validate platform name.

    Checks if the provided platform name is one of the supported platforms.

    Args:
        platform: Platform name (darwin, windows, linux).

    Returns:
        True if the platform is valid, False otherwise.
    """
    return platform.lower() in VALID_PLATFORMS


def validate_arch(arch: str) -> bool:
    """
    Validate architecture name.

    Checks if the provided architecture name is one of the supported architectures.

    Args:
        arch: Architecture name (x86_64, aarch64, arm64, i686).

    Returns:
        True if the architecture is valid, False otherwise.
    """
    return arch.lower() in VALID_ARCHITECTURES


def normalize_platform(platform: str) -> Optional[str]:
    """
    Normalize platform name to standard format.

    Converts various platform aliases to their canonical form.

    Args:
        platform: Original platform name.

    Returns:
        Normalized platform name, or None if invalid.
    """
    platform_lower = platform.lower()

    # Common alias mappings
    aliases = {
        "macos": "darwin",
        "mac": "darwin",
        "osx": "darwin",
        "win": "windows",
        "win32": "windows",
        "win64": "windows",
    }

    if platform_lower in aliases:
        return aliases[platform_lower]

    if platform_lower in VALID_PLATFORMS:
        return platform_lower

    return None


def normalize_arch(arch: str) -> Optional[str]:
    """
    Normalize architecture name to standard format.

    Converts various architecture aliases to their canonical form.

    Args:
        arch: Original architecture name.

    Returns:
        Normalized architecture name, or None if invalid.
    """
    arch_lower = arch.lower()

    # Common alias mappings
    aliases = {
        "arm64": "aarch64",
        "x64": "x86_64",
        "amd64": "x86_64",
        "x86": "i686",
        "i386": "i686",
    }

    if arch_lower in aliases:
        return aliases[arch_lower]

    if arch_lower in VALID_ARCHITECTURES:
        return arch_lower

    return None


def validate_email(email: str) -> bool:
    """
    Validate email address format.

    Checks if the provided string matches a valid email format.

    Args:
        email: Email address string.

    Returns:
        True if the format is valid, False otherwise.
    """
    if not email:
        return False
    pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(pattern.match(email))


def validate_url(url: str) -> bool:
    """
    Validate URL format.

    Checks if the provided string matches a valid URL format.

    Args:
        url: URL string.

    Returns:
        True if the format is valid, False otherwise.
    """
    if not url:
        return False
    pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return bool(pattern.match(url))
