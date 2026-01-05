# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: models/__init__.py
Description: Data models module initialization.
             Contains ORM entity models and Pydantic schema models for
             the release server's database operations and API validation.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

# ORM Entities
from models.entities import (
    Author,
    Release,
    Build,
    ChangelogEntry,
    DownloadLog,
    BugReport,
)

# Pydantic Schemas
from models.schemas import (
    # Author schemas
    AuthorInfo,
    AuthorCreateRequest,
    AuthorUpdateRequest,
    AuthorListResponse,
    ChangelogEntryAuthor,
    # Release schemas
    ReleaseInfo,
    ReleaseCreateRequest,
    ReleaseUpdateRequest,
    ReleaseListResponse,
    ReleaseResponse,
    # Build schemas
    PlatformBuildInfo,
    BuildUploadRequest,
    # Changelog schemas
    ChangelogEntryInfo,
    ChangelogEntryRequest,
    ChangelogResponse,
    # Bug Report schemas
    BugReportInfo,
    BugReportCreateRequest,
    BugReportUpdateRequest,
    BugReportListResponse,
    # Common schemas
    MessageResponse,
    TauriUpdateResponse,
)

__all__ = [
    # ORM Entities
    "Author",
    "Release",
    "Build",
    "ChangelogEntry",
    "DownloadLog",
    "BugReport",
    # Schemas - Author
    "AuthorInfo",
    "AuthorCreateRequest",
    "AuthorUpdateRequest",
    "AuthorListResponse",
    "ChangelogEntryAuthor",
    # Schemas - Release
    "ReleaseInfo",
    "ReleaseCreateRequest",
    "ReleaseUpdateRequest",
    "ReleaseListResponse",
    "ReleaseResponse",
    # Schemas - Build
    "PlatformBuildInfo",
    "BuildUploadRequest",
    # Schemas - Changelog
    "ChangelogEntryInfo",
    "ChangelogEntryRequest",
    "ChangelogResponse",
    # Schemas - Bug Report
    "BugReportInfo",
    "BugReportCreateRequest",
    "BugReportUpdateRequest",
    "BugReportListResponse",
    # Schemas - Common
    "MessageResponse",
    "TauriUpdateResponse",
]
