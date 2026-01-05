# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - ORM Entities Package

This package contains all SQLAlchemy ORM entity models for the GEO-SCOPE
Release Server database. These models define the database schema and provide
object-relational mapping for database operations.

Entities:
    - Author: Author/contributor information
    - Release: Version release records
    - Build: Platform-specific build artifacts
    - ChangelogEntry: Fine-grained changelog entries
    - DownloadLog: Download statistics tracking
    - BugReport: User bug report submissions

Utilities:
    - generate_id(): Generate unique 8-character IDs
    - utc_now(): Get current UTC timestamp

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from models.entities.base import generate_id, utc_now
from models.entities.author import Author
from models.entities.release import Release
from models.entities.build import Build
from models.entities.changelog import ChangelogEntry
from models.entities.download_log import DownloadLog
from models.entities.bug_report import BugReport

__all__ = [
    "generate_id",
    "utc_now",
    "Author",
    "Release",
    "Build",
    "ChangelogEntry",
    "DownloadLog",
    "BugReport",
]
