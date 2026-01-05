#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEO-SCOPE Release Server - Database Seed Script

This module provides database initialization and seed data population
for the GEO-SCOPE Release Server. It creates initial author profiles
and populates release history based on actual Git commit logs.

Features:
    - Author profile creation with avatar download
    - Multi-version release history population
    - Changelog entries with commit references
    - Build artifact metadata registration

Usage:
    python seed.py          # Initialize all data
    python seed.py --reset  # Reset database and reinitialize

Author: Silan Hu
Email: silan.hu@u.nus.edu
Version: 1.0.0
Created: 2026-01-04
Modified: 2026-01-05
"""

import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add project path
sys.path.insert(0, str(Path(__file__).parent))

from core.database import init_db, drop_all_tables, session_scope
from core.config import settings
from models.entities import Author, Release, Build, ChangelogEntry


# =============================================================================
# Author Seed Data
# =============================================================================

SEED_AUTHORS = [
    {
        "username": "silan",
        "name": "Hu Silan",
        "email": "silan.hu@u.nus.edu",
        "avatar_url": "/assets/avatars/silan.png",
        "github_url": "https://github.com/Qingbolan",
        "website_url": "https://qingbolan.github.io",
        "bio": {
            "en": "NUS Computer Science student, GEO-SCOPE creator",
            "zh": "NUS Computer Science student, GEO-SCOPE creator",
        },
        "role": "maintainer",
        "github_avatar": "https://github.com/Qingbolan.png",
    },
    {
        "username": "github-actions",
        "name": "GitHub Actions",
        "avatar_url": "/assets/avatars/github-actions.png",
        "github_url": "https://github.com/features/actions",
        "bio": {
            "en": "Automated CI/CD bot",
            "zh": "Automated CI/CD bot",
        },
        "role": "bot",
        "github_avatar": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    },
]


# =============================================================================
# Release Seed Data - Based on Actual Git Log
# =============================================================================

SEED_RELEASES = [
    # v0.1.0 - 2025-12-18: Project Initialization
    {
        "version": "0.1.0",
        "pub_date": datetime(2025, 12, 18, tzinfo=timezone.utc),
        "notes": {
            "en": "Project initialization",
            "zh": "Project initialization",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.1\n\nInitial project setup with core modules for content optimization and question analysis.",
            "zh": "# GEO-SCOPE v0.1\n\nInitial project setup with core modules for content optimization and question analysis.",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Project initialization", "zh": "Project initialization"},
                "detail": {"en": "Initial project setup and configuration.", "zh": "Initial project setup and configuration."},
                "commit_hash": "c91f0d9",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "Initial project structure", "zh": "Initial project structure"},
                "detail": {"en": "Set up initial project structure and dependencies.", "zh": "Set up initial project structure and dependencies."},
                "commit_hash": "77a8174",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "Content optimization module", "zh": "Content optimization module"},
                "detail": {"en": "Added content optimization and question analysis modules for AI visibility assessment.", "zh": "Added content optimization and question analysis modules for AI visibility assessment."},
                "commit_hash": "bbb6a98",
                "author_username": "silan"
            },
        ],
    },
    # v0.2.0 - 2025-12-20: Project Restructure
    {
        "version": "0.2.0",
        "pub_date": datetime(2025, 12, 20, tzinfo=timezone.utc),
        "notes": {
            "en": "Project restructure with GEO-SCOPE app",
            "zh": "Project restructure with GEO-SCOPE app",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.2\n\n## Major Changes\n- Restructured project with GEO-SCOPE as main application\n- Added LLM and state management modules\n- Reorganized project structure",
            "zh": "# GEO-SCOPE v0.2\n\n## Major Changes\n- Restructured project with GEO-SCOPE as main application\n- Added LLM and state management modules\n- Reorganized project structure",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Core types and LLM modules", "zh": "Core types and LLM modules"},
                "detail": {"en": "Refactored core types and added LLM/state management modules.", "zh": "Refactored core types and added LLM/state management modules."},
                "commit_hash": "8854075",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "GEO-SCOPE application structure", "zh": "GEO-SCOPE application structure"},
                "detail": {"en": "Restructured project with GEO-SCOPE app and example demos.", "zh": "Restructured project with GEO-SCOPE app and example demos."},
                "commit_hash": "13de3c3",
                "author_username": "silan"
            },
            {
                "type": "improve",
                "title": {"en": "Project organization cleanup", "zh": "Project organization cleanup"},
                "detail": {"en": "Reorganized project structure and removed legacy gallery folder.", "zh": "Reorganized project structure and removed legacy gallery folder."},
                "commit_hash": "f6224e4",
                "author_username": "silan"
            },
        ],
    },
    # v0.3.0 - 2025-12-21: Persona Cards
    {
        "version": "0.3.0",
        "pub_date": datetime(2025, 12, 21, tzinfo=timezone.utc),
        "notes": {
            "en": "Persona card components",
            "zh": "Persona card components",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.3\n\n## New Features\n- Persona card components for visualizing buyer personas\n- Enhanced persona generation with AI",
            "zh": "# GEO-SCOPE v0.3\n\n## New Features\n- Persona card components for visualizing buyer personas\n- Enhanced persona generation with AI",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Persona card components", "zh": "Persona card components"},
                "detail": {"en": "Added persona card components and enhanced AI-powered persona generation.", "zh": "Added persona card components and enhanced AI-powered persona generation."},
                "commit_hash": "dfae8c5",
                "author_username": "silan"
            },
        ],
    },
    # v0.4.0 - 2025-12-22: Backend and Frontend Foundation
    {
        "version": "0.4.0",
        "pub_date": datetime(2025, 12, 22, tzinfo=timezone.utc),
        "notes": {
            "en": "Initial backend and frontend",
            "zh": "Initial backend and frontend",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.4\n\n## New Features\n- Initial FastAPI backend implementation\n- React frontend with settings pages\n- Markdown rendering support",
            "zh": "# GEO-SCOPE v0.4\n\n## New Features\n- Initial FastAPI backend implementation\n- React frontend with settings pages\n- Markdown rendering support",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Backend and frontend foundation", "zh": "Backend and frontend foundation"},
                "detail": {"en": "Added initial FastAPI backend and React frontend for GEO-SCOPE.", "zh": "Added initial FastAPI backend and React frontend for GEO-SCOPE."},
                "commit_hash": "9b327f4",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "Settings pages", "zh": "Settings pages"},
                "detail": {"en": "Added settings pages with react-markdown support for rich text rendering.", "zh": "Added settings pages with react-markdown support for rich text rendering."},
                "commit_hash": "5c232b5",
                "author_username": "silan"
            },
        ],
    },
    # v0.5.0 - 2025-12-23: Benchmark Management
    {
        "version": "0.5.0",
        "pub_date": datetime(2025, 12, 23, tzinfo=timezone.utc),
        "notes": {
            "en": "Benchmark management system",
            "zh": "Benchmark management system",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.5\n\n## New Features\n- Complete benchmark management UI\n- Engine and role avatars\n- Journey optimization APIs\n- System info and changelog APIs",
            "zh": "# GEO-SCOPE v0.5\n\n## New Features\n- Complete benchmark management UI\n- Engine and role avatars\n- Journey optimization APIs\n- System info and changelog APIs",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Engine and role avatars", "zh": "Engine and role avatars"},
                "detail": {"en": "Added engine and role avatar images with updated UI components.", "zh": "Added engine and role avatar images with updated UI components."},
                "commit_hash": "cf9073e",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "Benchmark management UI", "zh": "Benchmark management UI"},
                "detail": {"en": "Added comprehensive benchmark management UI with types and state management.", "zh": "Added comprehensive benchmark management UI with types and state management."},
                "commit_hash": "fcd4aeb",
                "author_username": "silan"
            },
        ],
    },
    # v0.6.0 - 2025-12-24: Dashboard
    {
        "version": "0.6.0",
        "pub_date": datetime(2025, 12, 24, tzinfo=timezone.utc),
        "notes": {
            "en": "Dashboard API and benchmark lifecycle",
            "zh": "Dashboard API and benchmark lifecycle",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.6\n\n## New Features\n- Dashboard API for metrics visualization\n- Unified benchmark status lifecycle management",
            "zh": "# GEO-SCOPE v0.6\n\n## New Features\n- Dashboard API for metrics visualization\n- Unified benchmark status lifecycle management",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Dashboard API", "zh": "Dashboard API"},
                "detail": {"en": "Added dashboard API and unified benchmark status lifecycle management.", "zh": "Added dashboard API and unified benchmark status lifecycle management."},
                "commit_hash": "d397a66",
                "author_username": "silan"
            },
        ],
    },
    # v0.7.0 - 2025-12-25: Streaming Generation and AI Services
    {
        "version": "0.7.0",
        "pub_date": datetime(2025, 12, 25, tzinfo=timezone.utc),
        "notes": {
            "en": "Streaming generation and AI services",
            "zh": "Streaming generation and AI services",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.7\n\n## New Features\n- Streaming benchmark generation with SSE\n- Refactored LLM services with Oracle integration\n- Real-time generation progress\n- Persona-based question management",
            "zh": "# GEO-SCOPE v0.7\n\n## New Features\n- Streaming benchmark generation with SSE\n- Refactored LLM services with Oracle integration\n- Real-time generation progress\n- Persona-based question management",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Streaming benchmark generation", "zh": "Streaming benchmark generation"},
                "detail": {"en": "Added streaming benchmark generation with refactored LLM services.", "zh": "Added streaming benchmark generation with refactored LLM services."},
                "commit_hash": "f09e2d5",
                "author_username": "silan"
            },
        ],
    },
    # v0.8.0 - 2025-12-26: Run Execution
    {
        "version": "0.8.0",
        "pub_date": datetime(2025, 12, 26, tzinfo=timezone.utc),
        "notes": {
            "en": "Background run execution and analysis",
            "zh": "Background run execution and analysis",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.8\n\n## New Features\n- Background run execution\n- Result analysis agent\n- Semantic and parallel analysis\n- Improved run progress state management",
            "zh": "# GEO-SCOPE v0.8\n\n## New Features\n- Background run execution\n- Result analysis agent\n- Semantic and parallel analysis\n- Improved run progress state management",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Background run execution", "zh": "Background run execution"},
                "detail": {"en": "Added background run execution and result analysis agent.", "zh": "Added background run execution and result analysis agent."},
                "commit_hash": "1b8091b",
                "author_username": "silan"
            },
        ],
    },
    # v0.9.0 - 2025-12-27: Code Cleanup
    {
        "version": "0.9.0",
        "pub_date": datetime(2025, 12, 27, tzinfo=timezone.utc),
        "notes": {
            "en": "Legacy code cleanup",
            "zh": "Legacy code cleanup",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.9\n\n## Improvements\n- Removed legacy and unused pages\n- Codebase cleanup and optimization",
            "zh": "# GEO-SCOPE v0.9\n\n## Improvements\n- Removed legacy and unused pages\n- Codebase cleanup and optimization",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "improve",
                "title": {"en": "Legacy code removal", "zh": "Legacy code removal"},
                "detail": {"en": "Removed legacy and unused pages from frontend for cleaner codebase.", "zh": "Removed legacy and unused pages from frontend for cleaner codebase."},
                "commit_hash": "b1390e1",
                "author_username": "silan"
            },
        ],
    },
    # v0.10.0 - 2025-12-28: Benchmark Enhancements
    {
        "version": "0.10.0",
        "pub_date": datetime(2025, 12, 28, tzinfo=timezone.utc),
        "notes": {
            "en": "Benchmark update enhancements",
            "zh": "Benchmark update enhancements",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.10\n\n## Improvements\n- Enhanced benchmark update flow\n- Better question traceability",
            "zh": "# GEO-SCOPE v0.10\n\n## Improvements\n- Enhanced benchmark update flow\n- Better question traceability",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "improve",
                "title": {"en": "Question traceability", "zh": "Question traceability"},
                "detail": {"en": "Refactored benchmark update and enhanced question traceability.", "zh": "Refactored benchmark update and enhanced question traceability."},
                "commit_hash": "2920c04",
                "author_username": "silan"
            },
        ],
    },
    # v0.11.0 - 2025-12-29: Dialog Improvements
    {
        "version": "0.11.0",
        "pub_date": datetime(2025, 12, 29, tzinfo=timezone.utc),
        "notes": {
            "en": "Dialog UI improvements",
            "zh": "Dialog UI improvements",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.11\n\n## Improvements\n- Better dialog and tabs layout\n- Improved result detail display",
            "zh": "# GEO-SCOPE v0.11\n\n## Improvements\n- Better dialog and tabs layout\n- Improved result detail display",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "improve",
                "title": {"en": "Result dialog layout", "zh": "Result dialog layout"},
                "detail": {"en": "Adjusted dialog and tabs layout for ResultDetailDialog.", "zh": "Adjusted dialog and tabs layout for ResultDetailDialog."},
                "commit_hash": "2b7edd1",
                "author_username": "silan"
            },
        ],
    },
    # v0.12.0 - 2025-12-30: Competitor Analysis
    {
        "version": "0.12.0",
        "pub_date": datetime(2025, 12, 30, tzinfo=timezone.utc),
        "notes": {
            "en": "AI-powered competitor analysis",
            "zh": "AI-powered competitor analysis",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.12\n\n## New Features\n- AI-powered competitor gap analysis\n- Engine filter for dashboard\n- Enhanced competitor mention handling",
            "zh": "# GEO-SCOPE v0.12\n\n## New Features\n- AI-powered competitor gap analysis\n- Engine filter for dashboard\n- Enhanced competitor mention handling",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Competitor gap analysis", "zh": "Competitor gap analysis"},
                "detail": {"en": "Added AI-powered competitor gap analysis feature for strategic insights.", "zh": "Added AI-powered competitor gap analysis feature for strategic insights."},
                "commit_hash": "ad194a4",
                "author_username": "silan"
            },
        ],
    },
    # v0.13.0 - 2025-12-31: Versioning System
    {
        "version": "0.13.0",
        "pub_date": datetime(2025, 12, 31, tzinfo=timezone.utc),
        "notes": {
            "en": "Benchmark versioning system",
            "zh": "Benchmark versioning system",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.13\n\n## New Features\n- Benchmark versioning system\n- Unified Button and Card components\n\n## Improvements\n- Updated role icons\n- Cleanup of legacy prototype code",
            "zh": "# GEO-SCOPE v0.13\n\n## New Features\n- Benchmark versioning system\n- Unified Button and Card components\n\n## Improvements\n- Updated role icons\n- Cleanup of legacy prototype code",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Versioning system", "zh": "Versioning system"},
                "detail": {"en": "Added benchmark versioning system and cleaned up legacy prototype code.", "zh": "Added benchmark versioning system and cleaned up legacy prototype code."},
                "commit_hash": "e35c5f3",
                "author_username": "silan"
            },
        ],
    },
    # v0.14.0 - 2026-01-01: UI Redesign and i18n
    {
        "version": "0.14.0",
        "pub_date": datetime(2026, 1, 1, tzinfo=timezone.utc),
        "notes": {
            "en": "UI redesign and internationalization",
            "zh": "UI redesign and internationalization",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.14\n\n## New Features\n- Version history dialog\n- Avatar upload functionality\n- Theme customization\n\n## Improvements\n- Workspace page i18n\n- Product cards redesign\n- Sidebar navigation update",
            "zh": "# GEO-SCOPE v0.14\n\n## New Features\n- Version history dialog\n- Avatar upload functionality\n- Theme customization\n\n## Improvements\n- Workspace page i18n\n- Product cards redesign\n- Sidebar navigation update",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Version history dialog", "zh": "Version history dialog"},
                "detail": {"en": "Added version history dialog and run statistics for benchmarks.", "zh": "Added version history dialog and run statistics for benchmarks."},
                "commit_hash": "bd418ab",
                "author_username": "silan"
            },
        ],
    },
    # v0.15.0 - 2026-01-02: User Authentication
    {
        "version": "0.15.0",
        "pub_date": datetime(2026, 1, 2, tzinfo=timezone.utc),
        "notes": {
            "en": "User authentication and 3D login page",
            "zh": "User authentication and 3D login page",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.15\n\n## New Features\n- Secure user authentication\n- 3D animated login page\n- Product localization system\n- Scheduled tasks feature\n\n## Improvements\n- Modular API architecture\n- Benchmarks i18n support",
            "zh": "# GEO-SCOPE v0.15\n\n## New Features\n- Secure user authentication\n- 3D animated login page\n- Product localization system\n- Scheduled tasks feature\n\n## Improvements\n- Modular API architecture\n- Benchmarks i18n support",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "User authentication", "zh": "User authentication"},
                "detail": {"en": "Implemented secure user authentication with route protection.", "zh": "Implemented secure user authentication with route protection."},
                "commit_hash": "fee40ed",
                "author_username": "silan"
            },
        ],
    },
    # v0.16.0 - 2026-01-03: Card Masonry
    {
        "version": "0.16.0",
        "pub_date": datetime(2026, 1, 3, tzinfo=timezone.utc),
        "notes": {
            "en": "Card masonry layout and task scheduler",
            "zh": "Card masonry layout and task scheduler",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.16\n\n## New Features\n- Card masonry layout component\n- Entrance animations for cards\n- Backend task scheduler\n\n## Improvements\n- Dashboard trend support\n- Agent architecture refactor",
            "zh": "# GEO-SCOPE v0.16\n\n## New Features\n- Card masonry layout component\n- Entrance animations for cards\n- Backend task scheduler\n\n## Improvements\n- Dashboard trend support\n- Agent architecture refactor",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Card masonry layout", "zh": "Card masonry layout"},
                "detail": {"en": "Added CardMasonry component for responsive grid layouts.", "zh": "Added CardMasonry component for responsive grid layouts."},
                "commit_hash": "9ba9e88",
                "author_username": "silan"
            },
        ],
    },
    # v0.17.0 - 2026-01-04: Auto-Update System
    {
        "version": "0.17.0",
        "pub_date": datetime(2026, 1, 4, tzinfo=timezone.utc),
        "notes": {
            "en": "Auto-update system and CI/CD",
            "zh": "Auto-update system and CI/CD",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.17\n\n## New Features\n- Tauri auto-updater with beta channel\n- GitHub Actions CI/CD workflows\n- Release server with changelog API\n- Native file operations\n- Comprehensive i18n translations\n\n## Improvements\n- Static resource URL handling\n- Persona generation enhancements",
            "zh": "# GEO-SCOPE v0.17\n\n## New Features\n- Tauri auto-updater with beta channel\n- GitHub Actions CI/CD workflows\n- Release server with changelog API\n- Native file operations\n- Comprehensive i18n translations\n\n## Improvements\n- Static resource URL handling\n- Persona generation enhancements",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Tauri auto-updater", "zh": "Tauri auto-updater"},
                "detail": {"en": "Integrated Tauri updater and process plugins for seamless updates.", "zh": "Integrated Tauri updater and process plugins for seamless updates."},
                "commit_hash": "3cd62c8",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "CI/CD workflows", "zh": "CI/CD workflows"},
                "detail": {"en": "Added GitHub Actions workflows for release and web deployment.", "zh": "Added GitHub Actions workflows for release and web deployment."},
                "commit_hash": "ac5e811",
                "author_username": "silan"
            },
        ],
        "builds": [
            {"target": "darwin", "arch": "aarch64", "url": "/packages/darwin/aarch64/GEO-SCOPE_0.17.0_aarch64.dmg"},
            {"target": "darwin", "arch": "x86_64", "url": "/packages/darwin/x86_64/GEO-SCOPE_0.17.0_x64.dmg"},
            {"target": "windows", "arch": "x86_64", "url": "/packages/windows/x86_64/GEO-SCOPE_0.17.0_x64.msi"},
            {"target": "linux", "arch": "x86_64", "url": "/packages/linux/x86_64/GEO-SCOPE_0.17.0_amd64.AppImage"},
        ],
    },
    # v0.18.0 - 2026-01-05: Bug Report and Changelog Improvements
    {
        "version": "0.18.0",
        "pub_date": datetime(2026, 1, 5, tzinfo=timezone.utc),
        "notes": {
            "en": "Bug report feature, changelog improvements, and optimization page enhancements",
            "zh": "Bug report feature, changelog improvements, and optimization page enhancements",
        },
        "detail": {
            "en": "# GEO-SCOPE v0.18\n\n## New Features\n- Bug report dialog with screenshot upload support\n- Optimization detail dialog for viewing journey issues\n\n## Improvements\n- Changelog collapse/expand with gradient mask\n- Theme-colored hover states for action buttons\n- Journey filtering aligned with homepage metrics\n- Comprehensive i18n translations",
            "zh": "# GEO-SCOPE v0.18\n\n## New Features\n- Bug report dialog with screenshot upload support\n- Optimization detail dialog for viewing journey issues\n\n## Improvements\n- Changelog collapse/expand with gradient mask\n- Theme-colored hover states for action buttons\n- Journey filtering aligned with homepage metrics\n- Comprehensive i18n translations",
        },
        "author_username": "silan",
        "changelogs": [
            {
                "type": "feature",
                "title": {"en": "Bug report dialog and collapsible changelog", "zh": "Bug report dialog and collapsible changelog"},
                "detail": {"en": "Added bug report dialog with screenshot upload, collapsible changelog with gradient mask, theme-colored button hover states, and i18n translations for 7 languages.", "zh": "Added bug report dialog with screenshot upload, collapsible changelog with gradient mask, theme-colored button hover states, and i18n translations for 7 languages."},
                "commit_hash": "73b549f",
                "author_username": "silan"
            },
            {
                "type": "feature",
                "title": {"en": "Optimization detail dialog and journey filtering alignment", "zh": "Optimization detail dialog and journey filtering alignment"},
                "detail": {"en": "Added OptimizationDetailDialog with persona info, aligned journey filtering with homepage metrics, added result_id/run_id for navigation, and comprehensive i18n for optimization page.", "zh": "Added OptimizationDetailDialog with persona info, aligned journey filtering with homepage metrics, added result_id/run_id for navigation, and comprehensive i18n for optimization page."},
                "commit_hash": "b9f3b18",
                "author_username": "silan"
            },
        ],
    },
]


# =============================================================================
# Utility Functions
# =============================================================================

def download_avatar(url: str, save_path: Path) -> bool:
    """
    Download an avatar image from a URL.

    Args:
        url: Source URL for the avatar image
        save_path: Local path to save the downloaded image

    Returns:
        bool: True if download successful, False otherwise
    """
    try:
        print(f"    Downloading from {url}...")
        urllib.request.urlretrieve(url, save_path)
        print(f"    Saved to {save_path.name}")
        return True
    except Exception as e:
        print(f"    Failed: {e}")
        return False


# =============================================================================
# Seed Functions
# =============================================================================

def seed_authors():
    """
    Populate author data in the database.

    Creates author records from SEED_AUTHORS and downloads
    their avatar images from GitHub.
    """
    print("\nSeeding authors...")

    avatars_dir = settings.ASSETS_DIR / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    with session_scope() as session:
        for author_data in SEED_AUTHORS:
            # Check if already exists
            existing = session.query(Author).filter_by(username=author_data["username"]).first()
            if existing:
                print(f"  {author_data['username']} already exists")
                continue

            # Download avatar
            github_avatar = author_data.pop("github_avatar", None)
            avatar_filename = author_data.get("avatar_url", "").split("/")[-1]

            if avatar_filename and github_avatar:
                avatar_path = avatars_dir / avatar_filename
                if not avatar_path.exists():
                    print(f"  Downloading avatar for {author_data['username']}...")
                    download_avatar(github_avatar, avatar_path)

            # Create Author
            author = Author(
                username=author_data["username"],
                name=author_data["name"],
                email=author_data.get("email"),
                avatar_url=author_data.get("avatar_url"),
                github_url=author_data.get("github_url"),
                website_url=author_data.get("website_url"),
                bio=author_data.get("bio", {}),
                role=author_data.get("role", "contributor"),
            )
            session.add(author)
            print(f"  Created author: {author_data['name']} (@{author_data['username']})")


def seed_releases():
    """
    Populate release data in the database.

    Creates release records with builds and changelog entries
    from SEED_RELEASES.
    """
    print("\nSeeding releases...")

    with session_scope() as session:
        for release_data in SEED_RELEASES:
            # Check if version already exists
            existing = session.query(Release).filter_by(version=release_data["version"]).first()
            if existing:
                print(f"  v{release_data['version']} already exists")
                continue

            # Get author
            author_username = release_data.get("author_username", "silan")
            author = session.query(Author).filter_by(username=author_username).first()

            # Create Release
            release = Release(
                version=release_data["version"],
                pub_date=release_data.get("pub_date", datetime.now(timezone.utc)),
                notes=release_data.get("notes", {}),
                detail=release_data.get("detail", {}),
                author_id=author.id if author else None,
                is_active=True,
                is_critical=release_data.get("is_critical", False),
                is_prerelease=release_data.get("is_prerelease", False),
            )
            session.add(release)
            session.flush()  # Get release.id

            # Create Builds
            for build_data in release_data.get("builds", []):
                build = Build(
                    release_id=release.id,
                    target=build_data["target"],
                    arch=build_data["arch"],
                    url=build_data["url"],
                    signature=build_data.get("signature", ""),
                    size=build_data.get("size"),
                    sha256=build_data.get("sha256"),
                )
                session.add(build)

            # Create Changelog entries (each entry can have its own author)
            for idx, cl_data in enumerate(release_data.get("changelogs", [])):
                # Get entry author
                entry_author_username = cl_data.get("author_username")
                entry_author = None
                if entry_author_username:
                    entry_author = session.query(Author).filter_by(username=entry_author_username).first()

                entry = ChangelogEntry(
                    release_id=release.id,
                    type=cl_data.get("type", "improve"),
                    title=cl_data.get("title", {}),
                    detail=cl_data.get("detail"),
                    commit_hash=cl_data.get("commit_hash"),
                    issue_url=cl_data.get("issue_url"),
                    pr_url=cl_data.get("pr_url"),
                    author_id=entry_author.id if entry_author else None,
                    order=idx,
                )
                session.add(entry)

            changelog_count = len(release_data.get("changelogs", []))
            author_name = author.name if author else "Unknown"
            print(f"  Created v{release_data['version']} by {author_name} ({changelog_count} entries)")


def seed_all(reset: bool = False):
    """
    Run all seed operations.

    Args:
        reset: If True, drop all tables before seeding
    """
    print("GEO-SCOPE Release Server - Seed Script")
    print("=" * 50)

    if reset:
        print("\nResetting database...")
        drop_all_tables()
        print("  All tables dropped")

    # Initialize database
    print("\nInitializing database...")
    init_db()
    print("  Database initialized")

    # Seed authors first (before releases)
    seed_authors()

    # Seed releases
    seed_releases()

    print("\n" + "=" * 50)
    print("Seed completed!")
    print(f"   Total releases: {len(SEED_RELEASES)}")
    total_entries = sum(len(r.get("changelogs", [])) for r in SEED_RELEASES)
    print(f"   Total changelog entries: {total_entries}")


# =============================================================================
# Script Entry Point
# =============================================================================

if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed_all(reset=reset)
