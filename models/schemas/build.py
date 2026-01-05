# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Build Pydantic Schemas

This module provides Pydantic schemas for platform build
related API operations in the GEO-SCOPE Release Server.

Schemas:
    - PlatformBuildInfo: Platform build information response
    - BuildUploadRequest: Build upload request

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from typing import Optional
from pydantic import BaseModel


class PlatformBuildInfo(BaseModel):
    """
    Platform build information schema.

    Represents a platform-specific build artifact with download
    and verification information.

    Attributes:
        id (str): Unique identifier
        target (str): Target platform - "darwin", "windows", or "linux"
        arch (str): CPU architecture - "x86_64" or "aarch64"
        url (str): Download URL for the build
        signature (str): Cryptographic signature for verification
        size (int): File size in bytes
        sha256 (str): SHA256 checksum
        download_count (int): Number of downloads
    """
    id: Optional[str] = None
    target: str  # darwin, windows, linux
    arch: str  # x86_64, aarch64
    url: str  # Download URL
    signature: str = ""  # Signature content
    size: Optional[int] = None  # File size in bytes
    sha256: Optional[str] = None  # SHA256 checksum
    download_count: int = 0

    class Config:
        from_attributes = True


class BuildUploadRequest(BaseModel):
    """
    Build upload request schema.

    Used for adding platform builds to a release.

    Attributes:
        target (str): Target platform
        arch (str): CPU architecture
        url (str): Download URL
        signature (str): Cryptographic signature
        size (int): File size in bytes
        sha256 (str): SHA256 checksum
    """
    target: str
    arch: str
    url: str
    signature: str = ""
    size: Optional[int] = None
    sha256: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "target": "darwin",
                "arch": "aarch64",
                "url": "/packages/darwin/aarch64/GEO-SCOPE_0.2.0_aarch64.dmg",
                "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
                "size": 52428800,
                "sha256": "abc123..."
            }
        }
