#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEO-SCOPE Release Server - Main Application Entry Point

This module serves as the main entry point for the GEO-SCOPE Release Server,
responsible for:
1. Initializing the FastAPI application instance
2. Configuring CORS middleware for cross-origin requests
3. Registering API routers for various endpoints
4. Mounting static file directories for package downloads
5. Managing application lifecycle events

Technology Stack:
    - FastAPI: High-performance async web framework
    - SQLAlchemy: ORM for database operations
    - Uvicorn: ASGI server for production deployment

Usage:
    Development: uvicorn main:app --host 0.0.0.0 --port 8001 --reload
    Production:  python main.py

Author: Silan Hu
Email: silan.hu@u.nus.edu
Version: 1.0.0
Created: 2026-01-04
Modified: 2026-01-05
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import init_db
from services import release_service


# =============================================================================
# Logging Configuration
# =============================================================================

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Ensure required directories exist
settings.ensure_directories()


# =============================================================================
# Application Lifecycle Management
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle context manager.

    Handles initialization and cleanup operations during application
    startup and shutdown phases using asynccontextmanager.

    Startup Operations:
        - Initialize database connection and schema
        - Load existing release version data

    Shutdown Operations:
        - Log shutdown event
        - Clean up resources if needed

    Args:
        app: FastAPI application instance

    Yields:
        None: Control is passed to the running application
    """
    logger.info("Release server starting...")

    # Initialize database
    init_db()
    logger.info("Database initialized")

    # Load release data
    releases = release_service.get_all()
    logger.info(f"Loaded {len(releases)} releases")

    yield

    logger.info("Release server shutting down...")


# =============================================================================
# FastAPI Application Instance
# =============================================================================

app = FastAPI(
    title="GEO-SCOPE Release Server",
    version="1.0.0",
    description="Release management service for managing application versions and auto-update API",
    lifespan=lifespan,
)


# =============================================================================
# CORS Middleware Configuration
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins (restrict in production)
    allow_credentials=True,        # Allow credentials
    allow_methods=["*"],          # Allow all HTTP methods
    allow_headers=["*"],          # Allow all headers
)


# =============================================================================
# Health Check Endpoint
# =============================================================================

@app.get("/health")
def health_check():
    """
    Health check endpoint for service monitoring.

    Used by load balancers, Kubernetes probes, or monitoring
    systems to verify service availability.

    Returns:
        dict: Service status information containing:
            - status (str): Service status ("ok" indicates healthy)
            - service (str): Service name identifier
            - version (str): Service version number
    """
    return {
        "status": "ok",
        "service": "release-server",
        "version": "1.0.0"
    }


# =============================================================================
# API Router Registration
# =============================================================================

from api import (
    releases_router,    # Release version management
    update_router,      # Update check (Tauri Updater compatible)
    uploads_router,     # File upload handling
    authors_router,     # Author management
    bugs_router,        # Bug report handling
    summary_router,     # AI summary generation
)

app.include_router(releases_router)
app.include_router(update_router)
app.include_router(uploads_router)
app.include_router(authors_router)
app.include_router(bugs_router)
app.include_router(summary_router)


# =============================================================================
# Static File Hosting
# =============================================================================

# Package download directory (/packages/{target}/{arch}/{filename})
app.mount("/packages", StaticFiles(directory=str(settings.PACKAGES_DIR)), name="packages")

# Static assets directory (/assets/avatars/{filename})
app.mount("/assets", StaticFiles(directory=str(settings.ASSETS_DIR)), name="assets")

# Upload files directory (/uploads/{filename})
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")


# =============================================================================
# Application Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT
    )
