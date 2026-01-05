# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - API Dependencies Module

This module provides dependency injection utilities for FastAPI routes.
It exports common dependencies used across API endpoints, including
database session management and security verification functions.

Dependencies Provided:
    - get_db: Database session generator for SQLAlchemy ORM operations
    - verify_api_key: API key validation for protected endpoints
    - verify_beta_access: Beta channel access verification

Usage:
    ```python
    from api.deps import get_db, verify_api_key

    @router.post("/protected")
    def protected_endpoint(
        db: Session = Depends(get_db),
        _: str = Depends(verify_api_key)
    ):
        pass
    ```

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from typing import Generator

from sqlalchemy.orm import Session

from core.database import SessionLocal, get_db
from core.security import verify_api_key, verify_beta_access

# Re-export dependencies for convenient access
__all__ = [
    "get_db",
    "verify_api_key",
    "verify_beta_access",
]
