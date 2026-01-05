# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Releases API Router

This module provides RESTful API endpoints for managing application version
releases. It supports full CRUD operations for releases, build artifact
management, and changelog entry tracking with multi-language content support.

Endpoints:
    GET    /api/releases                              - List all releases
    GET    /api/releases/latest                       - Get latest active release
    GET    /api/releases/{version}                    - Get release by version
    POST   /api/releases                              - Create new release
    PATCH  /api/releases/{version}                    - Update release
    DELETE /api/releases/{version}                    - Delete release
    POST   /api/releases/{version}/builds             - Add build to release
    DELETE /api/releases/{version}/builds/{target}/{arch} - Remove build
    POST   /api/releases/{version}/changelogs         - Add changelog entry
    POST   /api/releases/reload                       - Reload config (legacy)

Features:
    - Multi-language release notes (en, zh, ja, etc.)
    - Platform-specific build management (darwin, windows, linux)
    - Architecture support (x86_64, aarch64)
    - Critical and prerelease version flags
    - Structured changelog entries

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from fastapi import APIRouter, HTTPException, Query, Depends

from api.deps import verify_api_key
from services import release_service, build_service
from models.schemas import (
    ReleaseInfo,
    ReleaseCreateRequest,
    ReleaseUpdateRequest,
    BuildUploadRequest,
    ChangelogEntryRequest,
    ChangelogEntryInfo,
    ReleaseListResponse,
    ReleaseResponse,
    MessageResponse,
)

router = APIRouter(prefix="/api/releases", tags=["releases"])


# =============================================================================
# Release Management Endpoints
# =============================================================================

@router.get("", response_model=ReleaseListResponse)
def list_releases(
    active_only: bool = Query(False, description="Return only active releases"),
) -> ReleaseListResponse:
    """
    Retrieve all release versions from the database.

    Returns a list of all registered releases, optionally filtered
    to show only active (non-hidden) releases.

    Args:
        active_only: If True, only return releases with is_active=True.
                    Defaults to False (return all releases).

    Returns:
        ReleaseListResponse: Object containing total count and
                            list of ReleaseInfo objects.
    """
    releases = release_service.get_all(active_only=active_only)
    release_list = [ReleaseInfo.from_db(r) for r in releases]
    return ReleaseListResponse(total=len(release_list), releases=release_list)


@router.get("/latest", response_model=ReleaseResponse)
def get_latest_release() -> ReleaseResponse:
    """
    Retrieve the most recent active release.

    Returns the latest release version that is marked as active
    and is not a prerelease version.

    Returns:
        ReleaseResponse: The latest release information.

    Raises:
        HTTPException: 404 if no active release is found.
    """
    release = release_service.get_latest()
    if not release:
        raise HTTPException(status_code=404, detail="No active release found")
    return ReleaseResponse(release=ReleaseInfo.from_db(release))


@router.get("/{version}", response_model=ReleaseResponse)
def get_release(version: str) -> ReleaseResponse:
    """
    Retrieve a specific release by version number.

    Args:
        version: The semantic version string (e.g., '1.0.0', '0.18.0').

    Returns:
        ReleaseResponse: The release information including builds,
                        changelogs, and multi-language content.

    Raises:
        HTTPException: 404 if release with given version is not found.
    """
    release = release_service.get_by_version(version)
    if not release:
        raise HTTPException(status_code=404, detail=f"Release {version} not found")
    return ReleaseResponse(release=ReleaseInfo.from_db(release))


@router.post("", response_model=ReleaseResponse)
def create_release(
    request: ReleaseCreateRequest,
    _: str = Depends(verify_api_key)
) -> ReleaseResponse:
    """
    Create a new release version.

    Creates a new release entry in the database. After creation, use the
    builds endpoint to add platform-specific build artifacts.

    Args:
        request: ReleaseCreateRequest containing:
            - version (required): Semantic version string
            - notes (optional): Multi-language short notes dict
            - detail (optional): Multi-language detailed changelog (Markdown)
            - author_username (optional): Username of release author
            - is_critical (optional): Mark as critical update
            - is_prerelease (optional): Mark as prerelease/beta
            - min_version (optional): Minimum version required to update
        _: API key for authentication (injected by dependency).

    Returns:
        ReleaseResponse: The newly created release information.

    Raises:
        HTTPException: 400 if version already exists or validation fails.

    Example Request Body:
        ```json
        {
            "version": "0.18.0",
            "notes": {"en": "Bug fixes", "zh": "问题修复"},
            "detail": {"en": "# Changelog...", "zh": "# 更新日志..."},
            "author_username": "silan",
            "is_critical": false,
            "is_prerelease": false
        }
        ```
    """
    try:
        release = release_service.create(
            version=request.version,
            notes=request.notes,
            detail=request.detail,
            author_username=request.author_username,
            is_critical=request.is_critical,
            is_prerelease=request.is_prerelease,
            min_version=request.min_version,
        )
        return ReleaseResponse(release=ReleaseInfo.from_db(release))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{version}", response_model=ReleaseResponse)
def update_release(
    version: str,
    request: ReleaseUpdateRequest,
    _: str = Depends(verify_api_key)
) -> ReleaseResponse:
    """
    Update an existing release version.

    Performs a partial update on a release record. Only provided fields
    will be updated. Note that notes and detail fields are merged with
    existing content rather than replaced entirely.

    Args:
        version: The version string of the release to update.
        request: ReleaseUpdateRequest containing fields to update:
            - notes: Multi-language release notes (merged, not replaced)
            - detail: Multi-language detailed changelog (merged)
            - author_username: Associated author
            - is_active: Visibility status
            - is_critical: Critical update flag
            - is_prerelease: Prerelease/beta flag
            - min_version: Minimum version requirement
        _: API key for authentication (injected by dependency).

    Returns:
        ReleaseResponse: The updated release information.

    Raises:
        HTTPException: 404 if release with given version is not found.
    """
    updated = release_service.update(
        version,
        notes=request.notes,
        detail=request.detail,
        author_username=request.author_username,
        is_active=request.is_active,
        is_critical=request.is_critical,
        is_prerelease=request.is_prerelease,
        min_version=request.min_version,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Release {version} not found")
    return ReleaseResponse(release=ReleaseInfo.from_db(updated))


@router.delete("/{version}", response_model=MessageResponse)
def delete_release(
    version: str,
    _: str = Depends(verify_api_key)
) -> MessageResponse:
    """
    Delete a release version.

    Permanently removes a release and all associated builds and
    changelog entries from the database. This action cannot be undone.

    Args:
        version: The version string of the release to delete.
        _: API key for authentication (injected by dependency).

    Returns:
        MessageResponse: Confirmation message of successful deletion.

    Raises:
        HTTPException: 404 if release with given version is not found.
    """
    if not release_service.delete(version):
        raise HTTPException(status_code=404, detail=f"Release {version} not found")
    return MessageResponse(message=f"Release {version} deleted")


# =============================================================================
# Build Management Endpoints
# =============================================================================

@router.post("/{version}/builds", response_model=ReleaseResponse)
def add_build(
    version: str,
    request: BuildUploadRequest,
    _: str = Depends(verify_api_key)
) -> ReleaseResponse:
    """
    Add a platform-specific build to a release.

    Registers a build artifact for a specific target platform and
    architecture combination. Used for Tauri updater support.

    Args:
        version: The version string of the release.
        request: BuildUploadRequest containing:
            - target: Operating system (darwin, windows, linux)
            - arch: CPU architecture (x86_64, aarch64)
            - url: Download URL for the build artifact
            - signature: Tauri signature content for verification
            - size: File size in bytes
            - sha256: SHA256 checksum of the file
        _: API key for authentication (injected by dependency).

    Returns:
        ReleaseResponse: The updated release with new build added.

    Raises:
        HTTPException: 404 if release with given version is not found.
    """
    updated = build_service.add_build(
        version=version,
        target=request.target,
        arch=request.arch,
        url=request.url,
        signature=request.signature,
        size=request.size,
        sha256=request.sha256,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Release {version} not found")
    return ReleaseResponse(release=ReleaseInfo.from_db(updated))


@router.delete("/{version}/builds/{target}/{arch}", response_model=ReleaseResponse)
def remove_build(
    version: str,
    target: str,
    arch: str,
    _: str = Depends(verify_api_key)
) -> ReleaseResponse:
    """
    Remove a platform-specific build from a release.

    Unregisters a build artifact for a specific target platform
    and architecture combination.

    Args:
        version: The version string of the release.
        target: Operating system (darwin, windows, linux).
        arch: CPU architecture (x86_64, aarch64).
        _: API key for authentication (injected by dependency).

    Returns:
        ReleaseResponse: The updated release with build removed.

    Raises:
        HTTPException: 404 if release with given version is not found.
    """
    updated = build_service.remove_build(version, target, arch)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Release {version} not found")
    return ReleaseResponse(release=ReleaseInfo.from_db(updated))


# =============================================================================
# Changelog Entry Endpoints
# =============================================================================

@router.post("/{version}/changelogs", response_model=ChangelogEntryInfo)
def add_changelog_entry(
    version: str,
    request: ChangelogEntryRequest,
    _: str = Depends(verify_api_key)
) -> ChangelogEntryInfo:
    """
    Add a changelog entry to a release.

    Creates a structured changelog item for a release, supporting
    multi-language titles and details with optional links to
    issues, PRs, and commits.

    Args:
        version: The version string of the release.
        request: ChangelogEntryRequest containing:
            - type: Change type (feature, improve, fix, breaking,
                   security, deprecated)
            - title: Multi-language title dict {"en": "...", "zh": "..."}
            - detail: Multi-language details (optional)
            - issue_url: Related issue link (optional)
            - pr_url: Related PR link (optional)
            - commit_hash: Related commit hash (optional)
            - author_username: Author of the change (optional)
        _: API key for authentication (injected by dependency).

    Returns:
        ChangelogEntryInfo: The created changelog entry.

    Raises:
        HTTPException: 404 if release with given version is not found.
    """
    entry = release_service.add_changelog_entry(
        version=version,
        type=request.type,
        title=request.title,
        detail=request.detail,
        issue_url=request.issue_url,
        pr_url=request.pr_url,
        commit_hash=request.commit_hash,
        author_username=request.author_username,
    )
    if not entry:
        raise HTTPException(status_code=404, detail=f"Release {version} not found")
    return ChangelogEntryInfo.model_validate(entry)


# =============================================================================
# Utility Endpoints
# =============================================================================

@router.post("/reload", response_model=MessageResponse)
def reload_config(_: str = Depends(verify_api_key)) -> MessageResponse:
    """
    Reload release configuration (legacy endpoint).

    This endpoint exists for backward compatibility. With database
    storage, manual reload is not required as data is always fresh.

    Args:
        _: API key for authentication (injected by dependency).

    Returns:
        MessageResponse: Informational message.

    Note:
        This endpoint has no effect when using database storage.
    """
    return MessageResponse(message="Using database storage, no reload needed")
