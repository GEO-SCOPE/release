# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Security Authentication Module

This module provides API authentication and authorization functionality
for the GEO-SCOPE Release Server. It implements secure API key validation
using constant-time comparison to prevent timing attacks.

Key Features:
    - Bearer token authentication (Authorization header)
    - X-API-Key header authentication
    - Beta channel access verification
    - Constant-time comparison for security

Usage:
    from core.security import verify_api_key, verify_beta_access

    # As FastAPI dependency
    @app.post("/releases", dependencies=[Depends(verify_api_key)])
    def create_release(data: ReleaseCreate):
        ...

    # Check beta access
    if verify_beta_access(beta_key):
        include_prerelease = True

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import secrets
import logging
from typing import Optional

from fastapi import HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.config import settings

logger = logging.getLogger(__name__)

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


async def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> str:
    """
    Verify API key for protected endpoints.

    Supports two authentication methods:
        1. Authorization: Bearer <token>
        2. X-API-Key: <token>

    Bearer token takes precedence if both are provided.

    Args:
        credentials: HTTP Bearer credentials from Authorization header
        x_api_key: API key from X-API-Key header

    Returns:
        str: The validated API key token

    Raises:
        HTTPException: 401 if no API key is provided
        HTTPException: 403 if the API key is invalid
    """
    token = None

    # Check Bearer token first (higher priority)
    if credentials:
        token = credentials.credentials

    # Fall back to X-API-Key header
    if not token and x_api_key:
        token = x_api_key

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Use 'Authorization: Bearer <key>' or 'X-API-Key: <key>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(token, settings.RELEASE_API_KEY):
        raise HTTPException(
            status_code=403,
            detail="Invalid API key",
        )

    return token


def verify_beta_access(beta_key: Optional[str] = None) -> bool:
    """
    Verify beta channel access permission.

    Checks if the provided key is in the configured set of valid
    beta access keys.

    Args:
        beta_key: Beta access key to validate

    Returns:
        bool: True if the key grants beta access, False otherwise
    """
    if not beta_key:
        return False
    return beta_key in settings.BETA_ACCESS_KEYS


def get_api_key_info() -> dict:
    """
    Get API key information for debugging purposes.

    Returns a dictionary with configuration status and a preview
    of the API key (first 8 characters only for security).

    Returns:
        dict: API key configuration information
            - configured (bool): Whether an API key is set
            - key_preview (str|None): First 8 characters of the key
    """
    return {
        "configured": bool(settings.RELEASE_API_KEY),
        "key_preview": f"{settings.RELEASE_API_KEY[:8]}..." if settings.RELEASE_API_KEY else None,
    }
