# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server - Application Configuration Module

This module manages all application configuration settings for the GEO-SCOPE
Release Server. It handles environment variable loading, directory setup,
API authentication keys, and various system limits.

Key Features:
    - Environment variable loading via python-dotenv (.env and .env.local)
    - Server configuration (host, port, debug mode)
    - Database URL configuration
    - API key management with auto-generation for development
    - Beta access channel key management
    - File storage paths and upload limits
    - CORS configuration

Usage:
    from core.config import settings

    # Access configuration values
    print(settings.HOST)
    print(settings.RELEASE_API_KEY)

    # Ensure directories exist
    settings.ensure_directories()

Author: Silan.Hu
Email: silan.hu@u.nus.edu
"""
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Project root directory
ROOT_DIR = Path(__file__).parent.parent

# Load environment files
# First try to load .env.local (local development), then load .env
load_dotenv(ROOT_DIR / ".env.local", override=True)
load_dotenv(ROOT_DIR / ".env")


class Settings:
    """
    Application configuration settings class.

    This class centralizes all configuration values for the application,
    loading them from environment variables with sensible defaults.

    Attributes:
        HOST (str): Server host address, defaults to "0.0.0.0"
        PORT (int): Server port number, defaults to 8001
        DEBUG (bool): Debug mode flag
        DATABASE_URL (str): SQLAlchemy database connection URL
        RELEASE_API_KEY (str): API authentication key
        BETA_ACCESS_KEYS (set): Set of valid beta access keys
        DATA_DIR (Path): Data storage directory path
        PACKAGES_DIR (Path): Package files directory path
        ASSETS_DIR (Path): Static assets directory path
        UPLOADS_DIR (Path): User uploads directory path
        MAX_AVATAR_SIZE (int): Maximum avatar file size in bytes
        ALLOWED_AVATAR_TYPES (set): Allowed MIME types for avatars
        MAX_SCREENSHOT_SIZE (int): Maximum screenshot file size in bytes
        ALLOWED_SCREENSHOT_TYPES (set): Allowed MIME types for screenshots
        CORS_ORIGINS (list): Allowed CORS origins
    """

    # ==========================================================================
    # Server Configuration
    # ==========================================================================
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # ==========================================================================
    # Database Configuration
    # ==========================================================================
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{ROOT_DIR / 'data' / 'releases.db'}"
    )

    # ==========================================================================
    # API Authentication
    # ==========================================================================
    # Auto-generate random key if not set (development environment only)
    _api_key = os.getenv("RELEASE_API_KEY")
    if not _api_key:
        _api_key = secrets.token_urlsafe(32)
        print(f"\n{'='*60}")
        print("  RELEASE_API_KEY not set, using auto-generated key:")
        print(f"   {_api_key}")
        print(f"{'='*60}\n")
    RELEASE_API_KEY: str = _api_key

    # ==========================================================================
    # Beta Test Channel
    # ==========================================================================
    # Multiple keys separated by commas
    # Example: BETA_ACCESS_KEYS="key1,key2,geo-scope-beta-2025"
    _beta_keys_str = os.getenv("BETA_ACCESS_KEYS", "geo-scope-beta-2025")
    BETA_ACCESS_KEYS: set = set(
        key.strip() for key in _beta_keys_str.split(",") if key.strip()
    )

    # ==========================================================================
    # File Storage
    # ==========================================================================
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", str(ROOT_DIR / "data")))
    PACKAGES_DIR: Path = Path(os.getenv("PACKAGES_DIR", str(ROOT_DIR / "packages")))
    ASSETS_DIR: Path = Path(os.getenv("ASSETS_DIR", str(ROOT_DIR / "assets")))
    UPLOADS_DIR: Path = Path(os.getenv("UPLOADS_DIR", str(ROOT_DIR / "data" / "uploads")))

    # Avatar upload limits (2MB default)
    MAX_AVATAR_SIZE: int = int(os.getenv("MAX_AVATAR_SIZE", str(2 * 1024 * 1024)))
    ALLOWED_AVATAR_TYPES: set = {"image/jpeg", "image/png", "image/gif", "image/webp"}

    # Bug screenshot upload limits (5MB default)
    MAX_SCREENSHOT_SIZE: int = int(os.getenv("MAX_SCREENSHOT_SIZE", str(5 * 1024 * 1024)))
    ALLOWED_SCREENSHOT_TYPES: set = {"image/jpeg", "image/png", "image/gif", "image/webp"}

    # ==========================================================================
    # CORS Configuration
    # ==========================================================================
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")

    @classmethod
    def ensure_directories(cls) -> None:
        """
        Ensure all required directories exist.

        Creates the following directory structure if not present:
            - DATA_DIR: Main data storage
            - PACKAGES_DIR: Package file storage
            - ASSETS_DIR: Static assets
            - ASSETS_DIR/avatars: Avatar images
            - UPLOADS_DIR: User uploaded files
            - UPLOADS_DIR/bugs: Bug report screenshots

        Returns:
            None
        """
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
        cls.PACKAGES_DIR.mkdir(parents=True, exist_ok=True)
        cls.ASSETS_DIR.mkdir(parents=True, exist_ok=True)
        cls.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        (cls.ASSETS_DIR / "avatars").mkdir(parents=True, exist_ok=True)
        (cls.UPLOADS_DIR / "bugs").mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = Settings()
