# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - API Routers Module

This module serves as the central hub for all API endpoint routers.
It imports and re-exports router instances from individual route modules,
making them available for registration with the main FastAPI application.

Available Routers:
    - releases_router: Version release management (CRUD operations)
    - update_router: Tauri updater protocol endpoints
    - uploads_router: File upload handling (packages, avatars)
    - authors_router: Author/contributor management
    - bugs_router: Bug report submission and retrieval
    - summary_router: AI-powered release summary generation

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from api.routers.releases import router as releases_router
from api.routers.update import router as update_router
from api.routers.uploads import router as uploads_router
from api.routers.authors import router as authors_router
from api.routers.bugs import router as bugs_router
from api.routers.summary import router as summary_router

__all__ = [
    "releases_router",
    "update_router",
    "uploads_router",
    "authors_router",
    "bugs_router",
    "summary_router",
]
