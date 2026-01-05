# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - API Module

This module serves as the main entry point for the API layer, providing RESTful
API routes for the release management system. It exports all router instances
that handle various API endpoints including releases, updates, uploads, authors,
bug reports, and AI-powered summary generation.

Module Structure:
    - releases_router: Manages application version releases
    - update_router: Handles Tauri updater protocol endpoints
    - uploads_router: Manages file uploads (packages, avatars)
    - authors_router: Manages release authors/contributors
    - bugs_router: Handles bug report submissions
    - summary_router: AI-powered release summary generation

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from api.routers import (
    releases_router,
    update_router,
    uploads_router,
    authors_router,
    bugs_router,
    summary_router,
)

__all__ = [
    "releases_router",
    "update_router",
    "uploads_router",
    "authors_router",
    "bugs_router",
    "summary_router",
]
