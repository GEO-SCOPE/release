# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Pydantic Schemas Package

This package contains all Pydantic schema models for API request/response
validation and serialization in the GEO-SCOPE Release Server.

Schema Categories:
    - Author: Author profile schemas (create, update, list)
    - Release: Version release schemas (create, update, list, response)
    - Build: Platform build artifact schemas
    - Changelog: Changelog entry schemas
    - BugReport: Bug report submission schemas
    - Common: Shared utility schemas (message response, pagination)

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from models.schemas.author import (
    AuthorInfo,
    AuthorCreateRequest,
    AuthorUpdateRequest,
    AuthorListResponse,
    ChangelogEntryAuthor,
)
from models.schemas.release import (
    ReleaseInfo,
    ReleaseCreateRequest,
    ReleaseUpdateRequest,
    ReleaseListResponse,
    ReleaseResponse,
)
from models.schemas.build import (
    PlatformBuildInfo,
    BuildUploadRequest,
)
from models.schemas.changelog import (
    ChangelogEntryInfo,
    ChangelogEntryRequest,
    ChangelogResponse,
)
from models.schemas.bug_report import (
    BugReportInfo,
    BugReportCreateRequest,
    BugReportUpdateRequest,
    BugReportListResponse,
)
from models.schemas.common import (
    MessageResponse,
    TauriUpdateResponse,
)

__all__ = [
    # Author
    "AuthorInfo",
    "AuthorCreateRequest",
    "AuthorUpdateRequest",
    "AuthorListResponse",
    "ChangelogEntryAuthor",
    # Release
    "ReleaseInfo",
    "ReleaseCreateRequest",
    "ReleaseUpdateRequest",
    "ReleaseListResponse",
    "ReleaseResponse",
    # Build
    "PlatformBuildInfo",
    "BuildUploadRequest",
    # Changelog
    "ChangelogEntryInfo",
    "ChangelogEntryRequest",
    "ChangelogResponse",
    # Bug Report
    "BugReportInfo",
    "BugReportCreateRequest",
    "BugReportUpdateRequest",
    "BugReportListResponse",
    # Common
    "MessageResponse",
    "TauriUpdateResponse",
]
