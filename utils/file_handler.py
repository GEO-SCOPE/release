# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/file_handler.py
Description: File handling utilities module.
             Provides file upload, download, deletion, and hash calculation
             operations for managing release artifacts and user uploads.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import os
import hashlib
import logging
from pathlib import Path
from typing import Optional, BinaryIO
from datetime import datetime

from fastapi import UploadFile

from core.config import settings

logger = logging.getLogger(__name__)


async def save_upload_file(
    upload_file: UploadFile,
    destination_dir: Path,
    filename: Optional[str] = None,
    max_size: Optional[int] = None,
    allowed_types: Optional[set] = None,
) -> Path:
    """
    Save an uploaded file to the specified destination.

    Handles file validation, directory creation, and secure file saving
    with optional size and type restrictions.

    Args:
        upload_file: FastAPI UploadFile object to save.
        destination_dir: Target directory for the file.
        filename: Custom filename (optional, defaults to generated name).
        max_size: Maximum file size in bytes (optional).
        allowed_types: Set of allowed MIME types (optional).

    Returns:
        Path to the saved file.

    Raises:
        ValueError: If file validation fails (type or size).
    """
    # Validate file type
    if allowed_types and upload_file.content_type not in allowed_types:
        raise ValueError(f"File type {upload_file.content_type} not allowed")

    # Ensure destination directory exists
    destination_dir.mkdir(parents=True, exist_ok=True)

    # Determine filename
    if not filename:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        ext = Path(upload_file.filename).suffix if upload_file.filename else ""
        filename = f"upload_{timestamp}{ext}"

    file_path = destination_dir / filename

    # Read and save file content
    content = await upload_file.read()

    # Validate file size
    if max_size and len(content) > max_size:
        raise ValueError(f"File size {len(content)} exceeds maximum {max_size}")

    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"File saved: {file_path}")
    return file_path


def delete_file(file_path: Path) -> bool:
    """
    Delete a file from the filesystem.

    Safely removes a file with proper error handling and logging.

    Args:
        file_path: Path to the file to delete.

    Returns:
        True if deletion succeeded, False if file doesn't exist or deletion failed.
    """
    try:
        if file_path.exists():
            os.remove(file_path)
            logger.info(f"File deleted: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete file {file_path}: {e}")
        return False


def get_file_hash(file_path: Path, algorithm: str = "sha256") -> Optional[str]:
    """
    Calculate file hash value.

    Computes a cryptographic hash of the file contents for integrity
    verification purposes.

    Args:
        file_path: Path to the file.
        algorithm: Hash algorithm (md5, sha1, sha256).

    Returns:
        Hexadecimal hash string, or None if file doesn't exist.
    """
    if not file_path.exists():
        return None

    hash_func = hashlib.new(algorithm)

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hash_func.update(chunk)

    return hash_func.hexdigest()


def get_file_size(file_path: Path) -> Optional[int]:
    """
    Get file size in bytes.

    Retrieves the size of a file from its filesystem metadata.

    Args:
        file_path: Path to the file.

    Returns:
        File size in bytes, or None if file doesn't exist.
    """
    if not file_path.exists():
        return None
    return file_path.stat().st_size


def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
    """
    Generate a unique filename.

    Creates a unique filename by combining timestamp, random suffix,
    and optional prefix to prevent filename collisions.

    Args:
        original_filename: Original filename (used for extension).
        prefix: Optional prefix for the filename.

    Returns:
        Unique filename string.
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    ext = Path(original_filename).suffix if original_filename else ""
    random_suffix = hashlib.md5(str(datetime.now().timestamp()).encode()).hexdigest()[:6]

    if prefix:
        return f"{prefix}_{timestamp}_{random_suffix}{ext}"
    return f"{timestamp}_{random_suffix}{ext}"
