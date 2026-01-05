# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Base Entity Utilities

This module provides common utility functions used across all entity models
in the GEO-SCOPE Release Server. It includes ID generation and timestamp
utilities that ensure consistency across the application.

Functions:
    - generate_id(): Generate unique 8-character short IDs using UUID
    - utc_now(): Get current UTC timestamp for consistent time handling

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import uuid
from datetime import datetime, timezone


def generate_id() -> str:
    """
    Generate a unique 8-character short ID.

    Creates a UUID and extracts the first 8 characters as a short
    identifier. This provides a good balance between uniqueness
    and readability for most use cases.

    Returns:
        str: An 8-character unique identifier string

    Example:
        >>> id = generate_id()
        >>> len(id)
        8
    """
    return str(uuid.uuid4())[:8]


def utc_now() -> datetime:
    """
    Get the current UTC timestamp.

    Returns a timezone-aware datetime object set to the current
    UTC time. This ensures consistent timestamps across different
    server locations and time zones.

    Returns:
        datetime: Current UTC timestamp with timezone info

    Example:
        >>> now = utc_now()
        >>> now.tzinfo
        datetime.timezone.utc
    """
    return datetime.now(timezone.utc)
