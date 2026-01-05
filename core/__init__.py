# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Core Module

This module provides the foundational infrastructure for the GEO-SCOPE Release
Server, including application configuration, database connectivity, and
security authentication mechanisms.

Components:
    - settings: Application configuration singleton
    - Base: SQLAlchemy declarative base for ORM models
    - engine: Database engine instance
    - SessionLocal: Session factory for database connections
    - get_db: FastAPI dependency for database sessions
    - session_scope: Context manager for transactional operations
    - init_db: Database initialization function
    - verify_api_key: API authentication dependency

Usage:
    from core import settings, get_db, verify_api_key

    # Access configuration
    print(settings.HOST, settings.PORT)

    # Use as FastAPI dependency
    @app.get("/items")
    def get_items(db: Session = Depends(get_db)):
        ...

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from core.config import settings
from core.database import Base, engine, SessionLocal, get_db, session_scope, init_db
from core.security import verify_api_key

__all__ = [
    "settings",
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "session_scope",
    "init_db",
    "verify_api_key",
]
