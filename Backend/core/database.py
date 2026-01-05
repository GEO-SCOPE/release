# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Database Configuration Module

This module provides database configuration and session management for the
GEO-SCOPE Release Server using SQLAlchemy ORM with SQLite backend.

Key Features:
    - SQLAlchemy engine configuration with SQLite
    - WAL (Write-Ahead Logging) mode for improved concurrency
    - Session factory for database connections
    - Context manager for transactional operations
    - Database initialization and teardown utilities

Usage:
    from core.database import get_db, session_scope, init_db

    # FastAPI dependency injection
    @app.get("/items")
    def get_items(db: Session = Depends(get_db)):
        return db.query(Item).all()

    # Context manager for standalone operations
    with session_scope() as session:
        session.add(new_item)

    # Initialize database tables
    init_db()

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session

from core.config import settings

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database file path
DATABASE_PATH = settings.DATA_DIR / "releases.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False,  # Set to True to see SQL logs
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record) -> None:
    """
    Configure SQLite pragmas for optimal performance.

    This function is called automatically when a new database connection
    is established. It sets the following pragmas:
        - journal_mode=WAL: Enables Write-Ahead Logging for better concurrency
        - synchronous=NORMAL: Balances safety and performance
        - foreign_keys=ON: Enforces foreign key constraints

    Args:
        dbapi_connection: The raw DBAPI connection object
        connection_record: Connection pool record (unused)

    Returns:
        None
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Get database session for FastAPI dependency injection.

    Yields a database session that is automatically closed after use.
    Use this as a dependency in FastAPI route handlers.

    Yields:
        Session: SQLAlchemy database session

    Example:
        @app.get("/releases")
        def list_releases(db: Session = Depends(get_db)):
            return db.query(Release).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """
    Provide a transactional scope for database operations.

    Creates a session that automatically commits on success and
    rolls back on exception. The session is closed after use.

    Yields:
        Session: SQLAlchemy database session

    Raises:
        Exception: Re-raises any exception after rollback

    Example:
        with session_scope() as session:
            release = Release(version="1.0.0")
            session.add(release)
            # Auto-commits if no exception
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """
    Initialize the database by creating all tables.

    Imports all entity models to ensure they are registered with
    SQLAlchemy's metadata before creating the tables.

    Returns:
        None
    """
    # Import all models to ensure they are registered
    from models.entities import Author, Release, Build, ChangelogEntry, DownloadLog, BugReport
    Base.metadata.create_all(bind=engine)


def drop_all_tables() -> None:
    """
    Drop all database tables.

    WARNING: This operation is destructive and irreversible.
    Use with caution, typically only for testing or development reset.

    Returns:
        None
    """
    Base.metadata.drop_all(bind=engine)
