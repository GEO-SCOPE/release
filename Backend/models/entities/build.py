# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Build Entity Model

This module defines the Build entity for storing platform-specific
build artifacts in the GEO-SCOPE Release Server.

The Build model supports:
    - Multiple target platforms (darwin, windows, linux)
    - Multiple architectures (x86_64, aarch64)
    - Download URLs and cryptographic signatures
    - File size and SHA256 checksum tracking
    - Per-build download statistics

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from core.database import Base
from models.entities.base import generate_id, utc_now


class Build(Base):
    """
    Platform Build entity model.

    Represents a platform-specific build artifact associated with a release.
    Each release can have multiple builds for different OS/architecture
    combinations.

    Attributes:
        id (str): Unique identifier (8-character short ID)
        release_id (str): Foreign key to Release entity
        target (str): Target platform - "darwin", "windows", or "linux"
        arch (str): CPU architecture - "x86_64" or "aarch64"
        url (str): Download URL for the build artifact
        signature (str): Cryptographic signature for verification
        size (int): File size in bytes (optional)
        sha256 (str): SHA256 checksum of the file (optional)
        download_count (int): Number of downloads for this build
        created_at (datetime): Record creation timestamp
        release (Release): Relationship to parent Release entity
    """
    __tablename__ = "builds"

    id = Column(String(36), primary_key=True, default=generate_id)
    release_id = Column(String(36), ForeignKey("releases.id"), nullable=False)
    target = Column(String(20), nullable=False)  # darwin, windows, linux
    arch = Column(String(20), nullable=False)  # x86_64, aarch64
    url = Column(String(500), nullable=False)
    signature = Column(Text, default="")
    size = Column(Integer, nullable=True)  # File size in bytes
    sha256 = Column(String(64), nullable=True)  # SHA256 checksum
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    release = relationship("Release", back_populates="builds")

    def to_dict(self) -> dict:
        """
        Convert entity to dictionary representation.

        Returns:
            dict: Dictionary containing all build fields
        """
        return {
            "id": self.id,
            "target": self.target,
            "arch": self.arch,
            "url": self.url,
            "signature": self.signature,
            "size": self.size,
            "sha256": self.sha256,
            "download_count": self.download_count,
        }
