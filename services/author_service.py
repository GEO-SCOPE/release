# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Author Service

This module provides the business logic for managing authors and
contributors in the GEO-SCOPE Release Server. It handles author
profile management including creation, updates, and avatar handling.

Key Features:
    - Create, read, update, delete authors
    - Multi-language biography support
    - Avatar URL management
    - Role-based classification

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import logging
from typing import Optional, List, Dict
from datetime import datetime, timezone

from core.database import session_scope
from models.entities import Author
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class AuthorService(BaseService[Author]):
    """
    Author management service.

    Handles all business operations related to author/contributor
    profiles including creation, updates, and role management.
    """

    def __init__(self):
        """Initialize the author service."""
        super().__init__(Author)

    def get_all(self, active_only: bool = False) -> List[Author]:
        """
        Get all authors.

        Args:
            active_only: If True, only return active authors

        Returns:
            list: List of Author entities ordered by creation date (newest first)
        """
        with session_scope() as session:
            query = session.query(Author)
            if active_only:
                query = query.filter(Author.is_active == True)
            authors = query.order_by(Author.created_at.desc()).all()
            for author in authors:
                session.expunge(author)
            return authors

    def get_by_username(self, username: str) -> Optional[Author]:
        """
        Get an author by username.

        Args:
            username: The unique username

        Returns:
            Author: The author if found, None otherwise
        """
        with session_scope() as session:
            author = session.query(Author).filter(Author.username == username).first()
            if author:
                session.expunge(author)
            return author

    def get_by_id(self, author_id: str) -> Optional[Author]:
        """
        Get an author by ID.

        Args:
            author_id: The author ID

        Returns:
            Author: The author if found, None otherwise
        """
        with session_scope() as session:
            author = session.query(Author).filter(Author.id == author_id).first()
            if author:
                session.expunge(author)
            return author

    def create(
        self,
        username: str,
        name: str,
        email: Optional[str] = None,
        avatar_url: Optional[str] = None,
        github_url: Optional[str] = None,
        website_url: Optional[str] = None,
        bio: Optional[Dict[str, str]] = None,
        role: str = "contributor",
    ) -> Author:
        """
        Create a new author.

        Args:
            username: Unique username identifier
            name: Display name
            email: Contact email
            avatar_url: Avatar image URL
            github_url: GitHub profile URL
            website_url: Personal website URL
            bio: Multi-language biography {"en": "...", "zh": "..."}
            role: Role type (maintainer, contributor, bot)

        Returns:
            Author: The created author entity

        Raises:
            ValueError: If the username already exists
        """
        with session_scope() as session:
            # Check if username already exists
            existing = session.query(Author).filter(Author.username == username).first()
            if existing:
                raise ValueError(f"Author {username} already exists")

            author = Author(
                username=username,
                name=name,
                email=email,
                avatar_url=avatar_url,
                github_url=github_url,
                website_url=website_url,
                bio=bio or {},
                role=role,
            )
            session.add(author)
            session.flush()
            session.expunge(author)
            logger.info(f"Created author {username}")
            return author

    def update(self, username: str, **kwargs) -> Optional[Author]:
        """
        Update an author's information.

        Bio fields are merged with existing content rather than replaced.

        Args:
            username: The username to update
            **kwargs: Fields to update

        Returns:
            Author: The updated author, or None if not found
        """
        with session_scope() as session:
            author = session.query(Author).filter(Author.username == username).first()
            if not author:
                return None

            # Handle bio update (merge rather than replace)
            if "bio" in kwargs and kwargs["bio"] is not None:
                current_bio = author.bio or {}
                current_bio.update(kwargs.pop("bio"))
                author.bio = current_bio

            # Update other fields
            for key, value in kwargs.items():
                if value is not None and hasattr(author, key):
                    setattr(author, key, value)

            author.updated_at = datetime.now(timezone.utc)
            session.flush()
            session.expunge(author)
            logger.info(f"Updated author {username}")
            return author

    def delete(self, username: str) -> bool:
        """
        Delete an author.

        Args:
            username: The username to delete

        Returns:
            bool: True if deleted, False if not found
        """
        with session_scope() as session:
            author = session.query(Author).filter(Author.username == username).first()
            if not author:
                return False
            session.delete(author)
            logger.info(f"Deleted author {username}")
            return True

    def update_avatar(self, username: str, avatar_url: str) -> Optional[Author]:
        """
        Update an author's avatar URL.

        Args:
            username: The username
            avatar_url: New avatar URL

        Returns:
            Author: The updated author, or None if not found
        """
        return self.update(username, avatar_url=avatar_url)
