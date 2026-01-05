# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Common Pydantic Schemas

This module provides common/shared Pydantic models used across
multiple API endpoints in the GEO-SCOPE Release Server.

Schemas:
    - MessageResponse: Generic message response for API operations
    - TauriUpdateResponse: Tauri auto-updater compatible response format
    - PaginationParams: Pagination parameter helper

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from typing import Optional
from pydantic import BaseModel


class MessageResponse(BaseModel):
    """
    Generic message response schema.

    Used for simple API responses that only need to convey
    a status message to the client.

    Attributes:
        message (str): Response message text
    """
    message: str


class TauriUpdateResponse(BaseModel):
    """
    Tauri Updater response format schema.

    This schema matches the response format expected by the
    Tauri auto-updater plugin for desktop application updates.

    Attributes:
        version (str): Version string (e.g., "1.0.0")
        pub_date (str): Publication date in ISO 8601 format
        url (str): Download URL for the update package
        signature (str): Cryptographic signature for verification
        notes (str): Optional release notes text
    """
    version: str
    pub_date: str
    url: str
    signature: str
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "version": "0.2.0",
                "pub_date": "2025-01-04T12:00:00Z",
                "url": "/packages/darwin/aarch64/GEO-SCOPE_0.2.0_aarch64.dmg",
                "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
                "notes": "- New: Auto update feature"
            }
        }


class PaginationParams(BaseModel):
    """
    Pagination parameters schema.

    Helper model for handling paginated list requests with
    computed offset and limit properties.

    Attributes:
        page (int): Current page number (1-indexed)
        page_size (int): Number of items per page
    """
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        """
        Calculate database offset for pagination.

        Returns:
            int: Number of records to skip
        """
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """
        Get the limit for database query.

        Returns:
            int: Maximum number of records to return
        """
        return self.page_size
