# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - DownloadLog Entity Model

This module defines the DownloadLog entity for tracking download
statistics in the GEO-SCOPE Release Server.

The DownloadLog model supports:
    - Per-build download tracking
    - IP address recording for analytics
    - User agent tracking for platform statistics
    - Timestamp recording for time-series analysis

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from sqlalchemy import Column, String, DateTime, ForeignKey

from core.database import Base
from models.entities.base import generate_id, utc_now


class DownloadLog(Base):
    """
    Download Log entity model.

    Records individual download events for statistical analysis.
    Linked to specific builds to track per-platform download metrics.

    Attributes:
        id (str): Unique identifier (8-character short ID)
        build_id (str): Foreign key to Build entity
        ip_address (str): Downloader IP address (optional)
        user_agent (str): Browser/client user agent string (optional)
        downloaded_at (datetime): Download timestamp
    """
    __tablename__ = "download_logs"

    id = Column(String(36), primary_key=True, default=generate_id)
    build_id = Column(String(36), ForeignKey("builds.id"), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    downloaded_at = Column(DateTime, default=utc_now)

    def to_dict(self) -> dict:
        """
        Convert entity to dictionary representation.

        Returns:
            dict: Dictionary containing all download log fields
        """
        return {
            "id": self.id,
            "build_id": self.build_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "downloaded_at": self.downloaded_at.isoformat() if self.downloaded_at else None,
        }
