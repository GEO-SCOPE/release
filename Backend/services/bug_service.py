# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Bug Service

This module provides the business logic for managing bug reports
in the GEO-SCOPE Release Server. It handles bug report creation,
updates, status tracking, and screenshot management.

Key Features:
    - Create, read, update, delete bug reports
    - Status and priority management
    - Screenshot attachment handling
    - Filtering by status and priority

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import logging
from typing import Optional, List
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import desc

from core.database import session_scope
from core.config import settings
from models.entities import BugReport
from services.base_service import BaseService
from utils.file_handler import save_upload_file, delete_file, generate_unique_filename

logger = logging.getLogger(__name__)


class BugService(BaseService[BugReport]):
    """
    Bug report management service.

    Handles all business operations related to bug reports including
    creation, updates, status management, and screenshot handling.
    """

    def __init__(self):
        """Initialize the bug service."""
        super().__init__(BugReport)

    def get_all(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[BugReport]:
        """
        Get all bug reports with optional filtering.

        Args:
            status: Filter by status (open, in_progress, resolved, closed, duplicate)
            priority: Filter by priority (low, normal, high, critical)
            limit: Maximum number of reports to return
            offset: Number of reports to skip

        Returns:
            list: List of BugReport entities ordered by creation date (newest first)
        """
        with session_scope() as session:
            query = session.query(BugReport)

            if status:
                query = query.filter(BugReport.status == status)
            if priority:
                query = query.filter(BugReport.priority == priority)

            reports = (
                query
                .order_by(desc(BugReport.created_at))
                .offset(offset)
                .limit(limit)
                .all()
            )

            for report in reports:
                session.expunge(report)
            return reports

    def get_by_id(self, report_id: str) -> Optional[BugReport]:
        """
        Get a bug report by ID.

        Args:
            report_id: The bug report ID

        Returns:
            BugReport: The bug report if found, None otherwise
        """
        with session_scope() as session:
            report = session.query(BugReport).filter(BugReport.id == report_id).first()
            if report:
                session.expunge(report)
            return report

    def create(
        self,
        title: str,
        description: str,
        steps_to_reproduce: Optional[str] = None,
        screenshots: Optional[List[str]] = None,
        app_version: Optional[str] = None,
        platform: Optional[str] = None,
        os_version: Optional[str] = None,
        user_agent: Optional[str] = None,
        contact_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        priority: str = "normal",
    ) -> BugReport:
        """
        Create a new bug report.

        Args:
            title: Bug title (required)
            description: Detailed description (required)
            steps_to_reproduce: Steps to reproduce the bug
            screenshots: List of screenshot URLs
            app_version: Application version
            platform: Platform name (darwin, windows, linux, web)
            os_version: Operating system version
            user_agent: Browser/client user agent
            contact_email: User contact email
            ip_address: Submitter IP address
            priority: Priority level (low, normal, high, critical)

        Returns:
            BugReport: The created bug report entity
        """
        with session_scope() as session:
            report = BugReport(
                title=title,
                description=description,
                steps_to_reproduce=steps_to_reproduce,
                screenshots=screenshots or [],
                app_version=app_version,
                platform=platform,
                os_version=os_version,
                user_agent=user_agent,
                contact_email=contact_email,
                ip_address=ip_address,
                priority=priority,
            )
            session.add(report)
            session.flush()
            session.expunge(report)
            logger.info(f"Created bug report: {title}")
            return report

    def update(self, report_id: str, **kwargs) -> Optional[BugReport]:
        """
        Update a bug report.

        Args:
            report_id: The bug report ID
            **kwargs: Fields to update

        Returns:
            BugReport: The updated bug report, or None if not found
        """
        with session_scope() as session:
            report = session.query(BugReport).filter(BugReport.id == report_id).first()
            if not report:
                return None

            # Update fields
            for key, value in kwargs.items():
                if value is not None and hasattr(report, key):
                    setattr(report, key, value)

            report.updated_at = datetime.now(timezone.utc)
            session.flush()
            session.expunge(report)
            logger.info(f"Updated bug report: {report_id}")
            return report

    def delete(self, report_id: str) -> bool:
        """
        Delete a bug report and its associated screenshots.

        Args:
            report_id: The bug report ID

        Returns:
            bool: True if deleted, False if not found
        """
        with session_scope() as session:
            report = session.query(BugReport).filter(BugReport.id == report_id).first()
            if not report:
                return False

            # Delete associated screenshot files
            if report.screenshots:
                for screenshot_path in report.screenshots:
                    full_path = settings.UPLOADS_DIR / screenshot_path.lstrip("/uploads/")
                    delete_file(full_path)

            session.delete(report)
            logger.info(f"Deleted bug report: {report_id}")
            return True

    def update_status(self, report_id: str, status: str) -> Optional[BugReport]:
        """
        Update the status of a bug report.

        Args:
            report_id: The bug report ID
            status: New status (open, in_progress, resolved, closed, duplicate)

        Returns:
            BugReport: The updated bug report, or None if not found

        Raises:
            ValueError: If status is invalid
        """
        valid_statuses = {"open", "in_progress", "resolved", "closed", "duplicate"}
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}")
        return self.update(report_id, status=status)

    def update_priority(self, report_id: str, priority: str) -> Optional[BugReport]:
        """
        Update the priority of a bug report.

        Args:
            report_id: The bug report ID
            priority: New priority (low, normal, high, critical)

        Returns:
            BugReport: The updated bug report, or None if not found

        Raises:
            ValueError: If priority is invalid
        """
        valid_priorities = {"low", "normal", "high", "critical"}
        if priority not in valid_priorities:
            raise ValueError(f"Invalid priority: {priority}")
        return self.update(report_id, priority=priority)

    def add_screenshot(self, report_id: str, screenshot_url: str) -> Optional[BugReport]:
        """
        Add a screenshot to a bug report.

        Args:
            report_id: The bug report ID
            screenshot_url: URL path of the screenshot

        Returns:
            BugReport: The updated bug report, or None if not found
        """
        with session_scope() as session:
            report = session.query(BugReport).filter(BugReport.id == report_id).first()
            if not report:
                return None

            screenshots = report.screenshots or []
            screenshots.append(screenshot_url)
            report.screenshots = screenshots
            report.updated_at = datetime.now(timezone.utc)

            session.flush()
            session.expunge(report)
            logger.info(f"Added screenshot to bug report: {report_id}")
            return report

    def count(self, status: Optional[str] = None) -> int:
        """
        Get the count of bug reports.

        Args:
            status: Optional status filter

        Returns:
            int: Number of bug reports matching the criteria
        """
        with session_scope() as session:
            query = session.query(BugReport)
            if status:
                query = query.filter(BugReport.status == status)
            return query.count()
