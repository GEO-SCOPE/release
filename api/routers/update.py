# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Update API Router

This module provides RESTful API endpoints for the Tauri application updater.
It implements the Tauri Updater protocol, allowing desktop applications to
check for and download updates. Supports both stable and beta update channels.

Endpoints:
    GET  /api/update/check          - Check for updates (Tauri protocol)
    GET  /api/update/latest         - Get latest version info
    GET  /api/update/changelog      - Get version changelog history
    POST /api/update/beta/validate  - Validate beta access key
    GET  /api/update/beta/check     - Check for beta updates
    GET  /api/update/beta/latest    - Get latest beta version info

Update Channels:
    - stable: Production releases (default)
    - beta: Pre-release versions (requires beta key)

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from services import update_service
from models.schemas import TauriUpdateResponse

router = APIRouter(prefix="/api/update", tags=["update"])


@router.get(
    "/check",
    response_model=TauriUpdateResponse,
    responses={
        200: {"description": "Update available"},
        204: {"description": "No update available"},
    }
)
def check_update(
    target: str = Query(..., description="Operating system (darwin/windows/linux)"),
    arch: str = Query(..., description="CPU architecture (x86_64/aarch64)"),
    version: str = Query(..., description="Current version number"),
    locale: str = Query("en", description="Language code (en/zh/ja/ko/fr/de/es)"),
) -> TauriUpdateResponse:
    """
    Check for application updates - Tauri Updater endpoint.

    This endpoint implements the Tauri Updater protocol, allowing
    desktop applications to query for available updates.

    Args:
        target: Operating system identifier.
            - 'darwin': macOS
            - 'windows': Windows
            - 'linux': Linux
        arch: CPU architecture identifier.
            - 'x86_64': Intel/AMD 64-bit
            - 'aarch64': ARM 64-bit (Apple Silicon, etc.)
        version: Client's current version string (e.g., '0.1.0').
        locale: Language code for localized release notes.

    Returns:
        TauriUpdateResponse: Update information if available.
        Response: 204 No Content if already up to date.

    Example Tauri Configuration:
        ```json
        {
            "plugins": {
                "updater": {
                    "endpoints": [
                        "https://api.geo-scope.ai/api/update/check?target={{target}}&arch={{arch}}&version={{current_version}}&locale=en"
                    ],
                    "pubkey": "YOUR_PUBLIC_KEY"
                }
            }
        }
        ```
    """
    result = update_service.check_update(version, target, arch, locale)

    if not result:
        return Response(status_code=204)

    return TauriUpdateResponse(**result)


@router.get("/latest")
def get_latest_version() -> dict:
    """
    Get the latest stable version information.

    Returns version details suitable for display in application
    "About" dialogs or version check notifications.

    Returns:
        dict: Object containing:
            - version: Latest version string
            - date: Release date
            - notes: Release notes
            - is_critical: Whether update is critical
        Or if no release available:
            - version: None
            - message: Informational message
    """
    info = update_service.get_latest_version_info()
    if not info:
        return {"version": None, "message": "No release available"}
    return info


@router.get("/changelog")
def get_changelog(
    limit: int = Query(10, description="Number of versions to return"),
    locale: str = Query("en", description="Language code (for fallback)"),
) -> dict:
    """
    Get the version changelog history.

    Returns release history with multi-language notes and details.
    Useful for displaying complete update history in the application.

    Args:
        limit: Maximum number of versions to return (default: 10).
        locale: Preferred language code for content fallback.

    Returns:
        dict: Object containing changelog entries with:
            - version: Version string
            - date: Release date
            - notes: Multi-language short summary (JSON)
            - detail: Multi-language detailed changelog (JSON)
    """
    return update_service.get_changelog(limit=limit, locale=locale)


# =============================================================================
# Beta Channel - Pre-release Update Channel
# =============================================================================

class BetaValidateRequest(BaseModel):
    """
    Request model for beta key validation.

    Attributes:
        beta_key: The beta access key to validate.
    """
    beta_key: str


class BetaValidateResponse(BaseModel):
    """
    Response model for beta key validation.

    Attributes:
        valid: Whether the key is valid.
        message: Human-readable status message.
        channel: Unlocked channel ('stable' or 'beta').
    """
    valid: bool
    message: str
    channel: str = "stable"


@router.post(
    "/beta/validate",
    response_model=BetaValidateResponse,
    summary="Validate Beta access key",
)
def validate_beta_key(request: BetaValidateRequest) -> BetaValidateResponse:
    """
    Validate a beta tester access key.

    Checks whether the provided beta key is valid and grants
    access to the beta update channel.

    Args:
        request: BetaValidateRequest containing the beta_key.

    Returns:
        BetaValidateResponse: Validation result with:
            - valid: True if key is accepted
            - message: Status message
            - channel: 'beta' if valid, 'stable' otherwise
    """
    if update_service.validate_beta_key(request.beta_key):
        return BetaValidateResponse(
            valid=True,
            message="Beta access granted",
            channel="beta",
        )
    return BetaValidateResponse(
        valid=False,
        message="Invalid beta key",
        channel="stable",
    )


@router.get(
    "/beta/check",
    response_model=TauriUpdateResponse,
    responses={
        200: {"description": "Update available (including beta)"},
        204: {"description": "No update available"},
        401: {"description": "Invalid beta key"},
    },
    summary="Check for Beta updates",
)
def check_beta_update(
    target: str = Query(..., description="Operating system (darwin/windows/linux)"),
    arch: str = Query(..., description="CPU architecture (x86_64/aarch64)"),
    version: str = Query(..., description="Current version number"),
    beta_key: str = Query(..., description="Beta access key"),
    locale: str = Query("en", description="Language code"),
) -> TauriUpdateResponse:
    """
    Check for beta channel updates including pre-release versions.

    Similar to /check but includes prerelease versions. Requires
    a valid beta key for access.

    Args:
        target: Operating system (darwin, windows, linux).
        arch: CPU architecture (x86_64, aarch64).
        version: Client's current version string.
        beta_key: Valid beta access key.
        locale: Language code for release notes.

    Returns:
        TauriUpdateResponse: Update information if available.
        Response: 204 No Content if no update available.

    Raises:
        HTTPException: 401 if beta key is invalid.

    Usage Flow:
        1. User double-clicks version number in app
        2. User enters beta key
        3. App switches to beta update channel
        4. App calls this endpoint for beta updates
    """
    # Validate beta key
    if not update_service.validate_beta_key(beta_key):
        raise HTTPException(status_code=401, detail="Invalid beta key")

    # Check for updates including prerelease versions
    result = update_service.check_update(
        version, target, arch, locale,
        include_prerelease=True
    )

    if not result:
        return Response(status_code=204)

    return TauriUpdateResponse(**result)


@router.get(
    "/beta/latest",
    summary="Get latest Beta version",
)
def get_latest_beta_version(
    beta_key: str = Query(..., description="Beta access key"),
) -> dict:
    """
    Get the latest beta version information.

    Returns version details including prerelease versions.
    Requires valid beta key for access.

    Args:
        beta_key: Valid beta access key.

    Returns:
        dict: Object containing:
            - version: Latest version string (may be prerelease)
            - channel: 'beta'
            - Additional version metadata
        Or if no release available:
            - version: None
            - message: Informational message

    Raises:
        HTTPException: 401 if beta key is invalid.
    """
    if not update_service.validate_beta_key(beta_key):
        raise HTTPException(status_code=401, detail="Invalid beta key")

    info = update_service.get_latest_version_info(include_prerelease=True)
    if not info:
        return {"version": None, "message": "No release available"}

    info["channel"] = "beta"
    return info
