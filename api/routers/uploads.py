# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Uploads API Router

This module provides RESTful API endpoints for file upload management.
It handles CI/CD build artifact uploads and avatar/asset uploads with
proper security validation and file organization.

Endpoints:
    POST   /api/uploads/{target}/{arch}/{filename}  - Upload build package
    DELETE /api/uploads/{target}/{arch}/{filename}  - Delete build package
    GET    /api/uploads/{target}/{arch}             - List packages for platform
    POST   /api/uploads/avatar                      - Upload avatar image
    DELETE /api/uploads/avatar/{filename}           - Delete avatar
    GET    /api/uploads/avatars                     - List all avatars

Features:
    - Platform-specific package organization (darwin, windows, linux)
    - Architecture support (x86_64, aarch64)
    - SHA256 checksum calculation
    - File type and size validation
    - Path traversal protection

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import hashlib
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse

from api.deps import verify_api_key
from core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


def get_package_path(target: str, arch: str, filename: str) -> Path:
    """
    Get the storage path for a build package file.

    Validates the target platform and architecture, then constructs
    the appropriate directory path. Creates directories if needed.

    Args:
        target: Operating system identifier (darwin, windows, linux).
        arch: CPU architecture (x86_64, aarch64).
        filename: Name of the package file.

    Returns:
        Path: Absolute path where the file should be stored.

    Raises:
        ValueError: If target or arch is not a valid identifier.
    """
    # Validate target platform
    if target not in ("darwin", "windows", "linux"):
        raise ValueError(f"Invalid target: {target}")
    if arch not in ("x86_64", "aarch64"):
        raise ValueError(f"Invalid arch: {arch}")

    # Create directory structure
    dir_path = settings.PACKAGES_DIR / target / arch
    dir_path.mkdir(parents=True, exist_ok=True)

    return dir_path / filename


@router.post("/{target}/{arch}/{filename}")
async def upload_package(
    target: str,
    arch: str,
    filename: str,
    request: Request,
    _: str = Depends(verify_api_key),
) -> JSONResponse:
    """
    Upload a build artifact package.

    Accepts binary file content and stores it in the appropriate
    platform/architecture directory. Calculates SHA256 checksum
    for integrity verification.

    Args:
        target: Operating system (darwin, windows, linux).
        arch: CPU architecture (x86_64, aarch64).
        filename: Desired filename for the package.
        request: FastAPI Request object containing binary body.
        _: API key for authentication (injected by dependency).

    Returns:
        JSONResponse: Upload result containing:
            - success: Boolean operation status
            - url: Download URL for the package
            - size: File size in bytes
            - sha256: SHA256 checksum of the file
            - path: Relative path (target/arch/filename)

    Raises:
        HTTPException: 400 if target/arch invalid or body empty.
        HTTPException: 500 if file write fails.

    Note:
        Request body should be raw binary (application/octet-stream).
    """
    try:
        file_path = get_package_path(target, arch, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Read request body
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty file content")

    # Calculate checksum
    sha256_hash = hashlib.sha256(body).hexdigest()

    # Write file to disk
    try:
        with open(file_path, "wb") as f:
            f.write(body)
        logger.info(f"Uploaded: {file_path} ({len(body)} bytes)")
    except Exception as e:
        logger.error(f"Failed to write file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Build download URL (relative to server root)
    download_url = f"/packages/{target}/{arch}/{filename}"

    return JSONResponse({
        "success": True,
        "url": download_url,
        "size": len(body),
        "sha256": sha256_hash,
        "path": f"{target}/{arch}/{filename}",
    })


@router.delete("/{target}/{arch}/{filename}")
async def delete_package(
    target: str,
    arch: str,
    filename: str,
    _: str = Depends(verify_api_key),
) -> dict:
    """
    Delete a build artifact package.

    Removes a previously uploaded package file from storage.

    Args:
        target: Operating system (darwin, windows, linux).
        arch: CPU architecture (x86_64, aarch64).
        filename: Name of the package file to delete.
        _: API key for authentication (injected by dependency).

    Returns:
        dict: Deletion result with success status and message.

    Raises:
        HTTPException: 400 if target/arch invalid.
        HTTPException: 404 if file not found.
        HTTPException: 500 if file deletion fails.
    """
    try:
        file_path = get_package_path(target, arch, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        file_path.unlink()
        logger.info(f"Deleted: {file_path}")
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

    return {"success": True, "message": f"Deleted {filename}"}


@router.get("/{target}/{arch}")
async def list_packages(target: str, arch: str) -> dict:
    """
    List all package files for a specific platform.

    Returns metadata for all uploaded packages matching the
    specified target platform and architecture.

    Args:
        target: Operating system (darwin, windows, linux).
        arch: CPU architecture (x86_64, aarch64).

    Returns:
        dict: Object containing files list with:
            - name: Filename
            - size: File size in bytes
            - modified: Last modification timestamp
            - url: Download URL

    Raises:
        HTTPException: 400 if target/arch invalid.
    """
    try:
        dir_path = settings.PACKAGES_DIR / target / arch
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not dir_path.exists():
        return {"files": []}

    files = []
    for file_path in dir_path.iterdir():
        if file_path.is_file():
            stat = file_path.stat()
            files.append({
                "name": file_path.name,
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "url": f"/packages/{target}/{arch}/{file_path.name}",
            })

    return {"files": sorted(files, key=lambda x: x["modified"], reverse=True)}


# =============================================================================
# Avatar Upload Endpoints
# =============================================================================


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
) -> JSONResponse:
    """
    Upload an avatar image.

    Accepts image files and stores them in the avatars directory
    with a unique generated filename to prevent collisions.

    Args:
        file: UploadFile containing the image data.
        _: API key for authentication (injected by dependency).

    Returns:
        JSONResponse: Upload result containing:
            - success: Boolean operation status
            - url: Access URL for the avatar
            - filename: Generated unique filename
            - size: File size in bytes

    Raises:
        HTTPException: 400 if file type invalid or size exceeds limit.
        HTTPException: 500 if file save fails.

    Supported Formats:
        JPEG, PNG, GIF, WebP (max 2MB)
    """
    # Validate file type
    if file.content_type not in settings.ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_AVATAR_TYPES)}"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > settings.MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_AVATAR_SIZE // 1024 // 1024}MB"
        )

    # Generate unique filename
    ext = Path(file.filename).suffix.lower() if file.filename else ".png"
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        ext = ".png"
    unique_filename = f"{uuid.uuid4().hex[:12]}{ext}"

    # Save file
    avatars_dir = settings.ASSETS_DIR / "avatars"
    file_path = avatars_dir / unique_filename
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Uploaded avatar: {file_path} ({len(content)} bytes)")
    except Exception as e:
        logger.error(f"Failed to save avatar: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Return access URL
    avatar_url = f"/assets/avatars/{unique_filename}"

    return JSONResponse({
        "success": True,
        "url": avatar_url,
        "filename": unique_filename,
        "size": len(content),
    })


@router.delete("/avatar/{filename}")
async def delete_avatar(
    filename: str,
    _: str = Depends(verify_api_key),
) -> dict:
    """
    Delete an avatar image.

    Removes an avatar file from storage. Includes path traversal
    protection to prevent directory escape attacks.

    Args:
        filename: Name of the avatar file to delete.
        _: API key for authentication (injected by dependency).

    Returns:
        dict: Deletion result with success status and message.

    Raises:
        HTTPException: 400 if filename contains path separators.
        HTTPException: 404 if avatar not found.
        HTTPException: 500 if deletion fails.
    """
    # Security check: prevent path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    avatars_dir = settings.ASSETS_DIR / "avatars"
    file_path = avatars_dir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")

    try:
        file_path.unlink()
        logger.info(f"Deleted avatar: {file_path}")
    except Exception as e:
        logger.error(f"Failed to delete avatar: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

    return {"success": True, "message": f"Deleted {filename}"}


@router.get("/avatars")
async def list_avatars() -> dict:
    """
    List all uploaded avatar images.

    Returns metadata for all avatar files in the avatars directory.

    Returns:
        dict: Object containing avatars list with:
            - filename: Avatar filename
            - url: Access URL
            - size: File size in bytes
            - modified: Last modification timestamp
    """
    avatars_dir = settings.ASSETS_DIR / "avatars"
    if not avatars_dir.exists():
        return {"avatars": []}

    avatars = []
    for file_path in avatars_dir.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            stat = file_path.stat()
            avatars.append({
                "filename": file_path.name,
                "url": f"/assets/avatars/{file_path.name}",
                "size": stat.st_size,
                "modified": stat.st_mtime,
            })

    return {"avatars": sorted(avatars, key=lambda x: x["modified"], reverse=True)}
