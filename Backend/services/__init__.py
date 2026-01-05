# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Services Package

This package provides the business logic layer for the GEO-SCOPE Release Server.
All database operations and business rules are encapsulated in service classes.

Services:
    - ReleaseService: Version release management
    - AuthorService: Author/contributor management
    - BuildService: Platform build artifact management
    - UpdateService: Version update checking for Tauri
    - BugService: Bug report handling

Global Instances:
    Pre-configured service instances are exported for convenience:
    - release_service
    - author_service
    - build_service
    - update_service
    - bug_service

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from services.release_service import ReleaseService
from services.author_service import AuthorService
from services.build_service import BuildService
from services.update_service import UpdateService
from services.bug_service import BugService

# Global service instances
release_service = ReleaseService()
author_service = AuthorService()
build_service = BuildService()
update_service = UpdateService()
bug_service = BugService()

__all__ = [
    "ReleaseService",
    "AuthorService",
    "BuildService",
    "UpdateService",
    "BugService",
    "release_service",
    "author_service",
    "build_service",
    "update_service",
    "bug_service",
]
