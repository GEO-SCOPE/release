# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Management System - Authors API Router

This module provides RESTful API endpoints for managing release authors and
contributors. It supports full CRUD operations for author records, including
multi-language biography support.

Endpoints:
    GET    /api/authors              - List all authors
    GET    /api/authors/{username}   - Get author by username
    POST   /api/authors              - Create new author (requires API key)
    PATCH  /api/authors/{username}   - Update author (requires API key)
    DELETE /api/authors/{username}   - Delete author (requires API key)

Features:
    - Multi-language bio support (en, zh, ja, etc.)
    - Active/inactive status filtering
    - Role-based categorization (developer, maintainer, contributor)

Author: Silan.Hu
Email: silan.hu@u.nus.edu
Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from fastapi import APIRouter, HTTPException, Query, Depends

from api.deps import verify_api_key
from services import author_service
from models.schemas import (
    AuthorInfo,
    AuthorCreateRequest,
    AuthorUpdateRequest,
    AuthorListResponse,
    MessageResponse,
)

router = APIRouter(prefix="/api/authors", tags=["authors"])


# =============================================================================
# Author Management Endpoints
# =============================================================================

@router.get("", response_model=AuthorListResponse)
def list_authors(
    active_only: bool = Query(False, description="Return only active authors"),
) -> AuthorListResponse:
    """
    Retrieve all authors from the database.

    This endpoint returns a list of all registered authors/contributors.
    Optionally filter to show only active authors.

    Args:
        active_only: If True, only return authors with is_active=True.
                    Defaults to False (return all authors).

    Returns:
        AuthorListResponse: Object containing total count and list of authors.

    Example:
        GET /api/authors?active_only=true
    """
    authors = author_service.get_all(active_only=active_only)
    author_list = [AuthorInfo.model_validate(a) for a in authors]
    return AuthorListResponse(total=len(author_list), authors=author_list)


@router.get("/{username}", response_model=AuthorInfo)
def get_author(username: str) -> AuthorInfo:
    """
    Retrieve a specific author by username.

    Args:
        username: The unique username identifier of the author.

    Returns:
        AuthorInfo: The author's information including name, email,
                   avatar URL, and multi-language bio.

    Raises:
        HTTPException: 404 if author with given username is not found.
    """
    author = author_service.get_by_username(username)
    if not author:
        raise HTTPException(status_code=404, detail=f"Author {username} not found")
    return AuthorInfo.model_validate(author)


@router.post("", response_model=AuthorInfo)
def create_author(
    request: AuthorCreateRequest,
    _: str = Depends(verify_api_key)
) -> AuthorInfo:
    """
    Create a new author record.

    Creates a new author/contributor entry in the database. Requires API key
    authentication for security.

    Args:
        request: AuthorCreateRequest containing:
            - username (required): Unique identifier
            - name (required): Display name
            - email (optional): Contact email
            - avatar_url (optional): Profile image URL
            - github_url (optional): GitHub profile URL
            - website_url (optional): Personal website URL
            - bio (optional): Multi-language biography dict
            - role (optional): Role classification
        _: API key for authentication (injected by dependency).

    Returns:
        AuthorInfo: The newly created author's information.

    Raises:
        HTTPException: 400 if username already exists or validation fails.

    Example Request Body:
        ```json
        {
            "username": "john_doe",
            "name": "John Doe",
            "email": "john@example.com",
            "bio": {"en": "Developer", "zh": "开发者"}
        }
        ```
    """
    try:
        author = author_service.create(
            username=request.username,
            name=request.name,
            email=request.email,
            avatar_url=request.avatar_url,
            github_url=request.github_url,
            website_url=request.website_url,
            bio=request.bio,
            role=request.role,
        )
        return AuthorInfo.model_validate(author)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{username}", response_model=AuthorInfo)
def update_author(
    username: str,
    request: AuthorUpdateRequest,
    _: str = Depends(verify_api_key)
) -> AuthorInfo:
    """
    Update an existing author's information.

    Performs a partial update on an author record. Only provided fields
    will be updated; unspecified fields remain unchanged. Note that the
    bio field is merged with existing content rather than replaced.

    Args:
        username: The unique username of the author to update.
        request: AuthorUpdateRequest containing fields to update.
        _: API key for authentication (injected by dependency).

    Returns:
        AuthorInfo: The updated author's information.

    Raises:
        HTTPException: 404 if author with given username is not found.

    Note:
        Bio field merges new language entries with existing ones,
        rather than replacing the entire bio object.
    """
    updated = author_service.update(
        username,
        name=request.name,
        email=request.email,
        avatar_url=request.avatar_url,
        github_url=request.github_url,
        website_url=request.website_url,
        bio=request.bio,
        role=request.role,
        is_active=request.is_active,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Author {username} not found")
    return AuthorInfo.model_validate(updated)


@router.delete("/{username}", response_model=MessageResponse)
def delete_author(
    username: str,
    _: str = Depends(verify_api_key)
) -> MessageResponse:
    """
    Delete an author record.

    Permanently removes an author from the database. This action cannot
    be undone. Requires API key authentication.

    Args:
        username: The unique username of the author to delete.
        _: API key for authentication (injected by dependency).

    Returns:
        MessageResponse: Confirmation message of successful deletion.

    Raises:
        HTTPException: 404 if author with given username is not found.
    """
    if not author_service.delete(username):
        raise HTTPException(status_code=404, detail=f"Author {username} not found")
    return MessageResponse(message=f"Author {username} deleted")
