# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - BugReport Pydantic Schemas

This module provides Pydantic schemas for bug report
related API operations in the GEO-SCOPE Release Server.

Schemas:
    - BugReportInfo: Bug report information response
    - BugReportCreateRequest: Bug report submission request
    - BugReportUpdateRequest: Bug report update request
    - BugReportListResponse: Paginated bug report list response

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class BugReportInfo(BaseModel):
    """
    Bug report information schema.

    Complete bug report details for API responses.

    Attributes:
        id (str): Unique identifier
        title (str): Bug title
        description (str): Detailed description
        steps_to_reproduce (str): Reproduction steps
        screenshots (list): List of screenshot URLs
        app_version (str): Application version
        platform (str): Platform name
        os_version (str): OS version
        contact_email (str): Contact email
        status (str): Status - "open", "in_progress", "resolved", "closed", "duplicate"
        priority (str): Priority - "low", "normal", "high", "critical"
        created_at (str): Creation timestamp
        updated_at (str): Last update timestamp
    """
    id: Optional[str] = None
    title: str
    description: str
    steps_to_reproduce: Optional[str] = None
    screenshots: List[str] = Field(default_factory=list)
    app_version: Optional[str] = None
    platform: Optional[str] = None
    os_version: Optional[str] = None
    contact_email: Optional[str] = None
    status: str = "open"
    priority: str = "normal"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_db(cls, bug_report) -> "BugReportInfo":
        """
        Create Pydantic model from database entity.

        Args:
            bug_report: SQLAlchemy BugReport entity

        Returns:
            BugReportInfo: Pydantic schema instance
        """
        return cls(
            id=bug_report.id,
            title=bug_report.title,
            description=bug_report.description,
            steps_to_reproduce=bug_report.steps_to_reproduce,
            screenshots=bug_report.screenshots or [],
            app_version=bug_report.app_version,
            platform=bug_report.platform,
            os_version=bug_report.os_version,
            contact_email=bug_report.contact_email,
            status=bug_report.status,
            priority=bug_report.priority,
            created_at=bug_report.created_at.isoformat() if bug_report.created_at else None,
            updated_at=bug_report.updated_at.isoformat() if bug_report.updated_at else None,
        )


class BugReportCreateRequest(BaseModel):
    """
    Bug report submission request schema.

    Used for submitting new bug reports.

    Attributes:
        title (str): Bug title (required)
        description (str): Detailed description (required)
        steps_to_reproduce (str): Reproduction steps
        screenshots (list): List of screenshot paths
        app_version (str): Application version
        platform (str): Platform name
        os_version (str): OS version
        contact_email (str): Contact email
        priority (str): Priority level
    """
    title: str
    description: str
    steps_to_reproduce: Optional[str] = None
    screenshots: List[str] = Field(default_factory=list)
    app_version: Optional[str] = None
    platform: Optional[str] = None
    os_version: Optional[str] = None
    contact_email: Optional[str] = None
    priority: str = "normal"

    class Config:
        json_schema_extra = {
            "example": {
                "title": "App crashes on startup",
                "description": "The application crashes immediately after launching",
                "steps_to_reproduce": "1. Open the app\n2. Wait 2 seconds\n3. App crashes",
                "app_version": "0.2.0",
                "platform": "darwin",
                "os_version": "macOS 14.0",
                "contact_email": "user@example.com",
                "priority": "high"
            }
        }


class BugReportUpdateRequest(BaseModel):
    """
    Bug report update request schema.

    Used for updating existing bug reports. All fields optional.

    Attributes:
        title (str): Bug title
        description (str): Detailed description
        steps_to_reproduce (str): Reproduction steps
        screenshots (list): List of screenshot paths
        status (str): Status update
        priority (str): Priority update
    """
    title: Optional[str] = None
    description: Optional[str] = None
    steps_to_reproduce: Optional[str] = None
    screenshots: Optional[List[str]] = None
    status: Optional[str] = None
    priority: Optional[str] = None


class BugReportListResponse(BaseModel):
    """
    Paginated bug report list response schema.

    Attributes:
        total (int): Total number of bug reports
        reports (list): List of BugReportInfo objects
    """
    total: int
    reports: List[BugReportInfo]
