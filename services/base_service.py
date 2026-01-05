# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Base Service Class

This module provides the base service class with common functionality
shared across all service implementations in the GEO-SCOPE Release Server.

The BaseService class provides:
    - Generic type support for entity types
    - Session management utilities
    - Object detachment helpers for SQLAlchemy

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import logging
from typing import TypeVar, Generic, Type, Optional, List
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import inspect

from core.database import session_scope, Base

T = TypeVar("T", bound=Base)


class BaseService(Generic[T]):
    """
    Base service class for all domain services.

    Provides common functionality including logging setup and
    SQLAlchemy session management utilities.

    Type Parameters:
        T: The entity type this service manages (must extend Base)

    Attributes:
        model (Type[T]): The SQLAlchemy model class
        logger (Logger): Logger instance for the service
    """

    def __init__(self, model: Type[T]):
        """
        Initialize the base service.

        Args:
            model: The SQLAlchemy model class for this service
        """
        self.model = model
        self.logger = logging.getLogger(self.__class__.__name__)

    def _safe_expunge(self, session: Session, obj) -> None:
        """
        Safely detach an object from the session.

        Only detaches the object if it is currently attached to the session
        (pending or persistent state). Silently handles cases where the
        object is already detached or cannot be inspected.

        Args:
            session: The SQLAlchemy session
            obj: The object to detach
        """
        try:
            state = inspect(obj)
            if state.pending or state.persistent:
                session.expunge(obj)
        except Exception:
            pass  # Object already detached or state cannot be inspected

    def _expunge_all(self, session: Session, objects: List) -> None:
        """
        Detach multiple objects from the session.

        Args:
            session: The SQLAlchemy session
            objects: List of objects to detach
        """
        for obj in objects:
            self._safe_expunge(session, obj)
