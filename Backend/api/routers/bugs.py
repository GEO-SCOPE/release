# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Bug Reports API Router

This module provides RESTful API endpoints for handling bug report submissions
from users. It supports file uploads for screenshots and stores reports in
the database for review by the development team.

Endpoints:
    POST /api/bugs              - Submit a new bug report
    GET  /api/bugs              - List bug reports (admin)
    GET  /api/bugs/{bug_id}     - Get specific bug report details

Features:
    - Multi-file screenshot uploads (up to 5 images)
    - Client metadata capture (IP, user agent, platform)
    - Status and priority filtering
    - Pagination support

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from core.config import settings
from services import bug_service
from models.schemas import BugReportInfo, BugReportListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bugs", tags=["bugs"])


# =============================================================================
# Helper Functions
# =============================================================================

def get_bug_screenshot_dir() -> Path:
    """
    Get the directory path for storing bug report screenshots.

    Creates the directory if it doesn't exist.

    Returns:
        Path: The absolute path to the bug screenshots directory.
    """
    dir_path = settings.UPLOADS_DIR / "bugs"
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def save_screenshot(content: bytes, ext: str) -> str:
    """
    Save a screenshot file and return its URL path.

    Generates a unique filename using timestamp and UUID to prevent
    collisions, then saves the file to the bug screenshots directory.

    Args:
        content: The binary content of the screenshot file.
        ext: The file extension including dot (e.g., '.png', '.jpg').

    Returns:
        str: The URL path to access the saved screenshot
             (e.g., '/uploads/bugs/bug_20240101120000_a1b2c3d4.png').
    """
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    filename = f"bug_{timestamp}_{unique_id}{ext}"

    # Save file to disk
    file_path = get_bug_screenshot_dir() / filename
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"Saved bug screenshot: {file_path} ({len(content)} bytes)")
    return f"/uploads/bugs/{filename}"


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("")
async def create_bug_report(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    steps_to_reproduce: Optional[str] = Form(None),
    app_version: Optional[str] = Form(None),
    platform: Optional[str] = Form(None),
    os_version: Optional[str] = Form(None),
    contact_email: Optional[str] = Form(None),
    screenshots: List[UploadFile] = File(default=[]),
) -> JSONResponse:
    """
    Submit a new bug report.

    Accepts form data with optional screenshot attachments. Captures
    client metadata automatically (IP address, user agent).

    Args:
        request: FastAPI Request object for accessing client info.
        title: Bug title (required, min 5 characters).
        description: Detailed bug description (required, min 10 characters).
        steps_to_reproduce: Steps to reproduce the bug (optional).
        app_version: Application version where bug occurred (optional).
        platform: Platform identifier (optional, e.g., 'darwin', 'windows').
        os_version: Operating system version (optional).
        contact_email: Reporter's email for follow-up (optional).
        screenshots: List of screenshot files (optional, max 5 files).

    Returns:
        JSONResponse: Success response with bug report ID and metadata.
            - success: Boolean indicating operation result
            - message: Human-readable status message
            - id: Unique identifier of created bug report
            - screenshots_count: Number of screenshots saved

    Raises:
        HTTPException: 400 if validation fails (title/description too short,
                      too many screenshots, invalid file type, file too large).
        HTTPException: 500 if database operation fails.
    """
    # Validate title and description
    if not title or len(title.strip()) < 5:
        raise HTTPException(status_code=400, detail="Title must be at least 5 characters")
    if not description or len(description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description must be at least 10 characters")

    # Process screenshot uploads
    screenshot_urls = []
    if screenshots:
        if len(screenshots) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 screenshots allowed")

        for file in screenshots:
            # Skip empty file entries
            if not file.filename:
                continue

            # Validate file type
            if file.content_type not in settings.ALLOWED_SCREENSHOT_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file.content_type}. Allowed: JPEG, PNG, GIF, WebP"
                )

            # Read file content
            content = await file.read()

            # Validate file size
            if len(content) > settings.MAX_SCREENSHOT_SIZE:
                raise HTTPException(status_code=400, detail="Each screenshot must be under 5MB")

            # Determine file extension
            ext = Path(file.filename).suffix.lower() if file.filename else ".png"
            if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
                ext = ".png"

            url = save_screenshot(content, ext)
            screenshot_urls.append(url)

    # Capture client information
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]

    # Create database record
    try:
        report = bug_service.create(
            title=title.strip(),
            description=description.strip(),
            steps_to_reproduce=steps_to_reproduce.strip() if steps_to_reproduce else None,
            screenshots=screenshot_urls,
            app_version=app_version,
            platform=platform,
            os_version=os_version,
            user_agent=user_agent,
            contact_email=contact_email,
            ip_address=client_ip,
        )

        logger.info(f"Created bug report: {report.id} - {title}")

        return JSONResponse({
            "success": True,
            "message": "Bug report submitted successfully",
            "id": report.id,
            "screenshots_count": len(screenshot_urls),
        })
    except Exception as e:
        logger.error(f"Failed to create bug report: {e}")
        raise HTTPException(status_code=500, detail="Failed to save bug report")


@router.get("")
async def list_bug_reports(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """
    Retrieve a list of bug reports with filtering and pagination.

    This endpoint is intended for administrative use to review
    submitted bug reports.

    Args:
        status: Filter by status (open, in_progress, resolved, closed).
        priority: Filter by priority (low, normal, high, critical).
        limit: Maximum number of reports to return (default: 50).
        offset: Number of records to skip for pagination (default: 0).

    Returns:
        dict: Object containing:
            - total: Total count of matching reports
            - reports: List of BugReportInfo objects
    """
    reports = bug_service.get_all(
        status=status,
        priority=priority,
        limit=limit,
        offset=offset,
    )
    total = bug_service.count(status=status)

    return {
        "total": total,
        "reports": [BugReportInfo.from_db(r) for r in reports],
    }


@router.get("/{bug_id}")
async def get_bug_report(bug_id: str) -> BugReportInfo:
    """
    Retrieve details of a specific bug report.

    Args:
        bug_id: The unique identifier of the bug report.

    Returns:
        BugReportInfo: Complete bug report details including
                      screenshots, metadata, and status.

    Raises:
        HTTPException: 404 if bug report with given ID is not found.
    """
    report = bug_service.get_by_id(bug_id)
    if not report:
        raise HTTPException(status_code=404, detail="Bug report not found")
    return BugReportInfo.from_db(report)
