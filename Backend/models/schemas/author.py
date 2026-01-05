# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Author Pydantic Schemas

This module provides Pydantic schemas for author/contributor
related API operations in the GEO-SCOPE Release Server.

Schemas:
    - ChangelogEntryAuthor: Simplified author info for changelog entries
    - AuthorInfo: Complete author information response
    - AuthorCreateRequest: Author creation request
    - AuthorUpdateRequest: Author update request
    - AuthorListResponse: Paginated author list response

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class ChangelogEntryAuthor(BaseModel):
    """
    Simplified author information for changelog entries.

    Contains only essential author fields needed for changelog
    display purposes.

    Attributes:
        username (str): Unique username identifier
        name (str): Display name
        avatar_url (str): Avatar image URL (optional)
        github_url (str): GitHub profile URL (optional)
    """
    username: str
    name: str
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None


class AuthorInfo(BaseModel):
    """
    Complete author information schema.

    Used for API responses containing full author details.

    Attributes:
        id (str): Unique identifier
        name (str): Display name
        username (str): Unique username
        email (str): Contact email (optional)
        avatar_url (str): Avatar image URL (optional)
        github_url (str): GitHub profile URL (optional)
        website_url (str): Personal website URL (optional)
        bio (dict): Multi-language biography {"en": "...", "zh": "..."}
        role (str): Role type - "maintainer", "contributor", or "bot"
    """
    id: Optional[str] = None
    name: str
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    bio: Dict[str, str] = Field(default_factory=dict)
    role: str = "contributor"

    class Config:
        from_attributes = True


class AuthorCreateRequest(BaseModel):
    """
    Author creation request schema.

    Used for creating new author/contributor records.

    Attributes:
        username (str): Unique username identifier
        name (str): Display name
        email (str): Contact email (optional)
        avatar_url (str): Avatar image URL (optional)
        github_url (str): GitHub profile URL (optional)
        website_url (str): Personal website URL (optional)
        bio (dict): Multi-language biography
        role (str): Role type
    """
    username: str
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    bio: Dict[str, str] = Field(default_factory=dict)
    role: str = "contributor"

    class Config:
        json_schema_extra = {
            "example": {
                "username": "silan.tech",
                "name": "Hu Silan",
                "email": "silan.hu@u.nus.edu",
                "avatar_url": "/assets/avatars/silan.png",
                "github_url": "https://github.com/Qingbolan",
                "bio": {
                    "en": "NUS CS PhD student, GEO-SCOPE creator and builder",
                    "zh": "NUS CS PhD student, GEO-SCOPE creator and builder"
                },
                "role": "maintainer"
            }
        }


class AuthorUpdateRequest(BaseModel):
    """
    Author update request schema.

    Used for partial updates to existing author records.
    All fields are optional.

    Attributes:
        name (str): Display name
        email (str): Contact email
        avatar_url (str): Avatar image URL
        github_url (str): GitHub profile URL
        website_url (str): Personal website URL
        bio (dict): Multi-language biography
        role (str): Role type
        is_active (bool): Active status flag
    """
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    bio: Optional[Dict[str, str]] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class AuthorListResponse(BaseModel):
    """
    Paginated author list response schema.

    Attributes:
        total (int): Total number of authors
        authors (list): List of AuthorInfo objects
    """
    total: int
    authors: List[AuthorInfo]
