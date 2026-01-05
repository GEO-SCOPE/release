# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - BugReport Entity Model

This module defines the BugReport entity for storing user-submitted
bug reports in the GEO-SCOPE Release Server.

The BugReport model supports:
    - Bug title and detailed description
    - Reproduction steps documentation
    - Screenshot attachments (JSON array)
    - Environment information (app version, platform, OS)
    - Status tracking (open, in_progress, resolved, closed, duplicate)
    - Priority levels (low, normal, high, critical)

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from sqlalchemy import Column, String, Text, DateTime, JSON

from core.database import Base
from models.entities.base import generate_id, utc_now


class BugReport(Base):
    """
    User Bug Report entity model.

    Represents a bug report submitted by users through the application.
    Includes environment information for debugging and screenshot support.

    Attributes:
        id (str): Unique identifier (8-character short ID)
        title (str): Short title describing the bug
        description (str): Detailed bug description
        steps_to_reproduce (str): Steps to reproduce the bug (optional)
        screenshots (list): JSON array of screenshot paths
        app_version (str): Application version where bug occurred
        platform (str): Platform - "darwin", "windows", "linux", or "web"
        os_version (str): Operating system version
        user_agent (str): Browser/client user agent string
        contact_email (str): User contact email (optional)
        status (str): Status - "open", "in_progress", "resolved", "closed", "duplicate"
        priority (str): Priority - "low", "normal", "high", "critical"
        ip_address (str): Submitter IP address (optional)
        created_at (datetime): Report submission timestamp
        updated_at (datetime): Last update timestamp
    """
    __tablename__ = "bug_reports"

    id = Column(String(36), primary_key=True, default=generate_id)

    # Report information
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    steps_to_reproduce = Column(Text, nullable=True)

    # Screenshots (stored as JSON array of paths)
    screenshots = Column(JSON, default=list)  # ["/uploads/bugs/xxx.png", ...]

    # Environment information
    app_version = Column(String(20), nullable=True)
    platform = Column(String(50), nullable=True)  # darwin, windows, linux, web
    os_version = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Contact information (optional)
    contact_email = Column(String(200), nullable=True)

    # Status: open, in_progress, resolved, closed, duplicate
    status = Column(String(20), default="open")
    priority = Column(String(20), default="normal")  # low, normal, high, critical

    # Metadata
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    def to_dict(self) -> dict:
        """
        Convert entity to dictionary representation.

        Returns:
            dict: Dictionary containing all bug report fields
        """
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "steps_to_reproduce": self.steps_to_reproduce,
            "screenshots": self.screenshots or [],
            "app_version": self.app_version,
            "platform": self.platform,
            "os_version": self.os_version,
            "contact_email": self.contact_email,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
