#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEO-SCOPE Release CLI - Command Line Interface for Release Management

This module provides a git-like command line interface for managing
GEO-SCOPE application releases remotely. It supports multi-language
content management for release notes and changelogs.

Features:
    - Remote server configuration and authentication
    - Push new releases with multi-language notes
    - Upload build artifacts with signature support
    - Manage changelog entries and version updates
    - Avatar upload and management
    - List and query release information

Usage Examples:
    geo-release config --server <url> --key <api-key>
    geo-release push <version> --notes '{"en": "...", "zh": "..."}'
    geo-release upload <file> --target darwin --arch aarch64
    geo-release list
    geo-release log [version] --lang en

Author: Silan Hu
Email: silan.hu@u.nus.edu
Version: 1.0.0
Created: 2026-01-04
Modified: 2026-01-05
"""

import os
import sys
import json
import hashlib
import argparse
from pathlib import Path
from typing import Optional, Dict
from datetime import datetime

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests")
    sys.exit(1)


# =============================================================================
# Configuration Constants
# =============================================================================

# Configuration file paths
CONFIG_DIR = Path.home() / ".geo-release"
CONFIG_FILE = CONFIG_DIR / "config.json"


# =============================================================================
# Configuration Management Functions
# =============================================================================

def load_config() -> dict:
    """
    Load CLI configuration from the config file.

    Reads the JSON configuration file from the user's home directory.
    Returns an empty dict if the file doesn't exist.

    Returns:
        dict: Configuration dictionary containing server URL and API key
    """
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}


def save_config(config: dict):
    """
    Save CLI configuration to the config file.

    Creates the config directory if it doesn't exist and writes
    the configuration as formatted JSON.

    Args:
        config: Configuration dictionary to save
    """
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Configuration saved to {CONFIG_FILE}")


def get_headers(config: dict) -> dict:
    """
    Build HTTP request headers with authentication.

    Constructs headers including Content-Type and Authorization
    bearer token if an API key is configured.

    Args:
        config: Configuration dictionary containing api_key

    Returns:
        dict: HTTP headers for API requests
    """
    headers = {"Content-Type": "application/json"}
    if config.get("api_key"):
        headers["Authorization"] = f"Bearer {config['api_key']}"
    return headers


# =============================================================================
# File Utility Functions
# =============================================================================

def read_file_content(file_path: str) -> str:
    """
    Read and return the content of a text file.

    Args:
        file_path: Path to the file to read

    Returns:
        str: File content as string

    Raises:
        SystemExit: If file is not found
    """
    path = Path(file_path)
    if not path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def read_json_file(file_path: str) -> dict:
    """
    Read and parse a JSON file.

    Args:
        file_path: Path to the JSON file

    Returns:
        dict: Parsed JSON content

    Raises:
        SystemExit: If file not found or invalid JSON
    """
    content = read_file_content(file_path)
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {file_path}: {e}")
        sys.exit(1)


def parse_json_or_simple(value: str, lang: str = "en") -> Dict[str, str]:
    """
    Parse a value as JSON or treat it as a simple string.

    Attempts to parse the input as JSON. If successful and it's a dict,
    returns it directly. Otherwise, wraps the value in a dict with the
    specified language as the key.

    Args:
        value: String value to parse (JSON or plain text)
        lang: Default language code for simple strings

    Returns:
        dict: Multi-language dictionary
    """
    if not value:
        return {}
    try:
        # Try parsing as JSON
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
        # If it's a string, use as default language
        return {lang: str(parsed)}
    except json.JSONDecodeError:
        # Not JSON, treat as default language string
        return {lang: value}


# =============================================================================
# Command Handlers
# =============================================================================

def cmd_config(args):
    """
    Handle the 'config' command for server configuration.

    Manages remote server URL and API key settings. Supports
    showing current configuration or updating values.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()

    if args.server:
        config["server"] = args.server.rstrip("/")
    if args.key:
        config["api_key"] = args.key

    if args.show:
        if config:
            print("Current configuration:")
            print(f"  Server: {config.get('server', '(not set)')}")
            print(f"  API Key: {'*' * 8 + config.get('api_key', '')[-4:] if config.get('api_key') else '(not set)'}")
        else:
            print("No configuration found. Use --server and --key to configure.")
        return

    if args.server or args.key:
        save_config(config)
        print("Configuration updated successfully.")
    else:
        print("Usage: geo-release config --server <url> --key <api-key>")
        print("       geo-release config --show")


def cmd_push(args):
    """
    Handle the 'push' command for creating new releases.

    Creates a new release version with multi-language notes,
    author information, and optional flags for critical/prerelease.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured. Run: geo-release config --server <url>")
        sys.exit(1)

    # Parse notes (multi-language)
    notes = {}
    if args.notes:
        notes = parse_json_or_simple(args.notes, args.default_lang)
    if args.notes_file:
        notes = read_json_file(args.notes_file)
        print(f"Read notes from: {args.notes_file}")

    # Parse detail (multi-language)
    detail = {}
    if args.detail:
        detail = parse_json_or_simple(args.detail, args.default_lang)
    if args.detail_file:
        detail = read_json_file(args.detail_file)
        print(f"Read detail from: {args.detail_file}")

    # Parse author
    author = None
    if args.author:
        author = parse_json_or_simple(args.author, "name")
        # If it's a simple string, convert to {"name": "..."}
        if "name" not in author and len(author) == 1:
            author = {"name": list(author.values())[0]}

    # Build request data
    data = {
        "version": args.version,
        "notes": notes,
        "detail": detail,
        "is_critical": args.critical,
        "is_prerelease": args.prerelease,
    }

    if author:
        data["author"] = author
    if args.min_version:
        data["min_version"] = args.min_version

    # Send request
    url = f"{config['server']}/api/releases"
    try:
        response = requests.post(url, json=data, headers=get_headers(config))

        if response.status_code == 200:
            result = response.json()
            release = result.get("release", {})
            print(f"Successfully pushed version {args.version}")
            print(f"   Published: {release.get('pub_date', 'N/A')}")
            if args.prerelease:
                print(f"   Type: Pre-release")
            if args.critical:
                print(f"   Critical: Yes")
            if notes:
                print(f"   Languages: {', '.join(notes.keys())}")
        elif response.status_code == 400:
            error = response.json()
            if "already exists" in error.get("detail", ""):
                print(f"Version {args.version} already exists. Use 'geo-release update' to modify.")
            else:
                print(f"Error: {error.get('detail', 'Unknown error')}")
        elif response.status_code in (401, 403):
            print("Error: Authentication failed. Check your API key.")
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")
        sys.exit(1)


def cmd_upload(args):
    """
    Handle the 'upload' command for uploading build artifacts.

    Uploads build files to the release server and optionally
    registers them with a specific version.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured. Run: geo-release config --server <url>")
        sys.exit(1)

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {args.file}")
        sys.exit(1)

    # Read file
    with open(file_path, "rb") as f:
        file_content = f.read()

    # Calculate checksum
    sha256 = hashlib.sha256(file_content).hexdigest()
    file_size = len(file_content)

    # Determine filename
    filename = args.filename or file_path.name

    print(f"Uploading {filename} ({file_size / 1024 / 1024:.2f} MB)...")

    # Upload file
    upload_url = f"{config['server']}/api/uploads/{args.target}/{args.arch}/{filename}"
    headers = get_headers(config)
    headers["Content-Type"] = "application/octet-stream"

    try:
        response = requests.post(upload_url, data=file_content, headers=headers)

        if response.status_code == 200:
            result = response.json()
            print(f"Upload successful!")
            print(f"   URL: {config['server']}{result['url']}")
            print(f"   SHA256: {sha256}")

            # If version specified, auto-register build
            if args.version:
                print(f"\nRegistering build for version {args.version}...")

                # Read signature file if provided
                signature = args.signature or ""
                if args.signature_file:
                    signature = read_file_content(args.signature_file)
                    print(f"Read signature from: {args.signature_file}")

                build_data = {
                    "target": args.target,
                    "arch": args.arch,
                    "url": result['url'],  # 只存储相对路径，前端自己拼接服务器地址
                    "signature": signature,
                    "size": file_size,
                    "sha256": sha256,
                }
                build_url = f"{config['server']}/api/releases/{args.version}/builds"
                build_response = requests.post(build_url, json=build_data, headers=get_headers(config))

                if build_response.status_code == 200:
                    print(f"Build registered for {args.target}/{args.arch}")
                else:
                    print(f"Failed to register build: {build_response.text}")
        else:
            print(f"Upload failed: HTTP {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")
        sys.exit(1)


def cmd_list(args):
    """
    Handle the 'list' command for listing all releases.

    Displays a formatted table of all releases with version,
    date, status, type, languages, and builds information.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured. Run: geo-release config --server <url>")
        sys.exit(1)

    url = f"{config['server']}/api/releases"
    if args.active:
        url += "?active_only=true"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            releases = data.get("releases", [])

            if not releases:
                print("No releases found.")
                return

            print(f"\n{'VERSION':<12} {'DATE':<12} {'STATUS':<12} {'TYPE':<10} {'LANGS':<10} {'BUILDS'}")
            print("-" * 80)

            for release in releases:
                version = release["version"]
                date = (release.get("pub_date") or "").split("T")[0]
                status = "active" if release.get("is_active") else "inactive"

                # Type marker
                type_str = ""
                if release.get("is_critical"):
                    type_str = "CRITICAL"
                elif release.get("is_prerelease"):
                    type_str = "pre"
                else:
                    type_str = "stable"

                # Language list
                notes = release.get("notes", {})
                langs = ", ".join(notes.keys()) if notes else "-"

                builds = ", ".join([f"{b['target']}/{b['arch']}" for b in release.get("builds", [])])

                print(f"{version:<12} {date:<12} {status:<12} {type_str:<10} {langs:<10} {builds or '-'}")

            print(f"\nTotal: {data.get('total', len(releases))} releases")
        else:
            print(f"Error: HTTP {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")


def cmd_log(args):
    """
    Handle the 'log' command for displaying changelogs.

    Shows release notes for a specific version or lists
    recent release logs with optional language selection.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured. Run: geo-release config --server <url>")
        sys.exit(1)

    if args.version:
        url = f"{config['server']}/api/releases/{args.version}"
    else:
        url = f"{config['server']}/api/update/changelog?limit={args.limit}"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()

            if args.version:
                # Single version
                release = data.get("release", data)
                print_release_log(release, args.lang, args.detail)
            else:
                # Multiple versions
                releases = data.get("releases", [])
                for release in releases:
                    print_release_log(release, args.lang, args.detail)
                    print()
        elif response.status_code == 404:
            print(f"Version {args.version} not found.")
        else:
            print(f"Error: HTTP {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")


def print_release_log(release: dict, lang: str = "en", show_detail: bool = False):
    """
    Print formatted release log information.

    Displays version, date, type markers, and release notes
    in the specified language with fallback support.

    Args:
        release: Release data dictionary
        lang: Preferred language code
        show_detail: Whether to show detailed changelog
    """
    version = release.get("version", "?")
    date = (release.get("pub_date") or "").split("T")[0]

    # Get notes in specified language with fallback
    notes_dict = release.get("notes", {})
    notes = notes_dict.get(lang) or notes_dict.get("en") or next(iter(notes_dict.values()), "")

    # Type markers
    type_markers = []
    if release.get("is_critical"):
        type_markers.append("CRITICAL")
    if release.get("is_prerelease"):
        type_markers.append("pre-release")
    type_str = f" [{', '.join(type_markers)}]" if type_markers else ""

    print(f"v{version} ({date}){type_str}")
    print("-" * 40)

    if notes:
        for line in notes.strip().split("\n"):
            print(f"  {line}")
    else:
        print("  (No release notes)")

    # Show detailed log
    if show_detail:
        detail_dict = release.get("detail", {})
        detail = detail_dict.get(lang) or detail_dict.get("en") or next(iter(detail_dict.values()), "")
        if detail:
            print("\n  --- Detailed Changelog ---")
            for line in detail.strip().split("\n"):
                print(f"  {line}")


def cmd_update(args):
    """
    Handle the 'update' command for modifying release information.

    Updates existing release with new notes, details, author info,
    or status flags.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured. Run: geo-release config --server <url>")
        sys.exit(1)

    data = {}

    # Parse notes (multi-language)
    if args.notes:
        data["notes"] = parse_json_or_simple(args.notes, args.default_lang)
    if args.notes_file:
        data["notes"] = read_json_file(args.notes_file)
        print(f"Read notes from: {args.notes_file}")

    # Parse detail (multi-language)
    if args.detail:
        data["detail"] = parse_json_or_simple(args.detail, args.default_lang)
    if args.detail_file:
        data["detail"] = read_json_file(args.detail_file)
        print(f"Read detail from: {args.detail_file}")

    # Parse author
    if args.author:
        author = parse_json_or_simple(args.author, "name")
        if "name" not in author and len(author) == 1:
            author = {"name": list(author.values())[0]}
        data["author"] = author

    if args.active is not None:
        data["is_active"] = args.active
    if args.critical is not None:
        data["is_critical"] = args.critical
    if args.prerelease is not None:
        data["is_prerelease"] = args.prerelease

    if not data:
        print("Error: No updates specified.")
        print("Use --notes, --notes-file, --detail, --detail-file, --author, --active, --critical, or --prerelease")
        return

    url = f"{config['server']}/api/releases/{args.version}"
    try:
        response = requests.patch(url, json=data, headers=get_headers(config))

        if response.status_code == 200:
            print(f"Version {args.version} updated successfully")
        elif response.status_code == 404:
            print(f"Version {args.version} not found")
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")


def cmd_changelog(args):
    """
    Handle the 'changelog' command for adding changelog entries.

    Adds a new changelog entry to a specific release version
    with type, text, and optional links.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured. Run: geo-release config --server <url>")
        sys.exit(1)

    # Parse text (multi-language)
    text = parse_json_or_simple(args.text, args.default_lang)

    if not text:
        print("Error: --text is required")
        return

    data = {
        "type": args.type,
        "text": text,
    }

    if args.issue:
        data["issue_url"] = args.issue
    if args.pr:
        data["pr_url"] = args.pr
    if args.commit:
        data["commit_hash"] = args.commit

    url = f"{config['server']}/api/releases/{args.version}/changelogs"
    try:
        response = requests.post(url, json=data, headers=get_headers(config))

        if response.status_code == 200:
            result = response.json()
            print(f"Changelog entry added to version {args.version}")
            print(f"   Type: {result.get('type')}")
            text_result = result.get('text', {})
            for lang, content in text_result.items():
                print(f"   [{lang}]: {content}")
        elif response.status_code == 404:
            print(f"Version {args.version} not found")
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")


def cmd_delete(args):
    """
    Handle the 'delete' command for removing releases.

    Deletes a release version after confirmation unless
    --force flag is provided.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured.")
        sys.exit(1)

    if not args.force:
        confirm = input(f"Are you sure you want to delete version {args.version}? [y/N] ")
        if confirm.lower() != "y":
            print("Cancelled.")
            return

    url = f"{config['server']}/api/releases/{args.version}"
    try:
        response = requests.delete(url, headers=get_headers(config))

        if response.status_code == 200:
            print(f"Version {args.version} deleted")
        elif response.status_code == 404:
            print(f"Version {args.version} not found")
        else:
            print(f"Error: HTTP {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to {config['server']}")


def cmd_avatar(args):
    """
    Handle the 'avatar' command for managing avatar images.

    Supports uploading, listing, and deleting avatar images
    for author profiles.

    Args:
        args: Parsed command line arguments
    """
    config = load_config()
    if not config.get("server"):
        print("Error: Server not configured.")
        sys.exit(1)

    if args.action == "upload":
        # Upload avatar
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {args.file}")
            sys.exit(1)

        # Check file type
        suffix = file_path.suffix.lower()
        if suffix not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            print(f"Error: Unsupported file type: {suffix}")
            print("Supported: .jpg, .jpeg, .png, .gif, .webp")
            sys.exit(1)

        # Check file size (2MB limit)
        file_size = file_path.stat().st_size
        if file_size > 2 * 1024 * 1024:
            print(f"Error: File too large ({file_size / 1024 / 1024:.1f}MB). Maximum: 2MB")
            sys.exit(1)

        url = f"{config['server']}/api/uploads/avatar"
        headers = {"Authorization": f"Bearer {config.get('api_key', '')}"}

        try:
            with open(file_path, "rb") as f:
                files = {"file": (file_path.name, f, f"image/{suffix.lstrip('.')}")}
                response = requests.post(url, headers=headers, files=files)

            if response.status_code == 200:
                data = response.json()
                full_url = f"{config['server']}{data['url']}"
                print(f"Avatar uploaded successfully!")
                print(f"  URL: {full_url}")
                print(f"  Filename: {data['filename']}")
                print(f"  Size: {data['size']} bytes")
                print()
                print("Use this URL in author info:")
                print(f'  --author \'{{"name": "YourName", "avatar": "{full_url}"}}\'')
            else:
                print(f"Error: HTTP {response.status_code}")
                if response.text:
                    print(response.text)
        except requests.exceptions.ConnectionError:
            print(f"Error: Cannot connect to {config['server']}")

    elif args.action == "list":
        # List all avatars
        url = f"{config['server']}/api/uploads/avatars"
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                avatars = data.get("avatars", [])
                if not avatars:
                    print("No avatars found.")
                    return

                print(f"Found {len(avatars)} avatar(s):\n")
                for avatar in avatars:
                    full_url = f"{config['server']}{avatar['url']}"
                    print(f"  {avatar['filename']}")
                    print(f"    URL: {full_url}")
                    print(f"    Size: {avatar['size']} bytes")
                    print()
            else:
                print(f"Error: HTTP {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"Error: Cannot connect to {config['server']}")

    elif args.action == "delete":
        # Delete avatar
        if not args.filename:
            print("Error: --filename required for delete action")
            sys.exit(1)

        if not args.force:
            confirm = input(f"Are you sure you want to delete {args.filename}? [y/N] ")
            if confirm.lower() != "y":
                print("Cancelled.")
                return

        url = f"{config['server']}/api/uploads/avatar/{args.filename}"
        headers = {"Authorization": f"Bearer {config.get('api_key', '')}"}

        try:
            response = requests.delete(url, headers=headers)
            if response.status_code == 200:
                print(f"Avatar {args.filename} deleted")
            elif response.status_code == 404:
                print(f"Avatar {args.filename} not found")
            else:
                print(f"Error: HTTP {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"Error: Cannot connect to {config['server']}")


# =============================================================================
# Main Entry Point
# =============================================================================

def main():
    """
    Main entry point for the CLI application.

    Parses command line arguments and dispatches to the
    appropriate command handler function.
    """
    parser = argparse.ArgumentParser(
        prog="geo-release",
        description="GEO-SCOPE Release CLI - Release management tool with multi-language support",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Configure remote server
  geo-release config --server https://releases.geo-scope.ai --key YOUR_API_KEY

  # Push a release with multi-language notes (JSON format)
  geo-release push 0.2.0 --notes '{"en": "New: Auto update", "zh": "New feature: Auto update"}'

  # Push a release with notes from JSON file
  geo-release push 0.2.0 --notes-file ./notes.json --detail-file ./detail.json

  # Push with simple string (uses default language)
  geo-release push 0.2.0 --notes "New: Auto update" --default-lang en

  # Push a pre-release version
  geo-release push 0.3.0-beta.1 --prerelease --notes '{"en": "Beta release"}'

  # Upload a build file with signature
  geo-release upload ./GEO-SCOPE_0.2.0.dmg \\
      --target darwin --arch aarch64 \\
      --version 0.2.0 \\
      --signature-file ./GEO-SCOPE_0.2.0.dmg.sig

  # Add a changelog entry
  geo-release changelog 0.2.0 --type feature \\
      --text '{"en": "Added auto-update", "zh": "Added auto-update feature"}' \\
      --pr https://github.com/org/repo/pull/123

  # List all releases
  geo-release list

  # Show changelog in specific language
  geo-release log 0.2.0 --lang zh --detail

  # Update release notes (merges with existing)
  geo-release update 0.2.0 --notes '{"ja": "Japanese description"}'

  # Delete a release
  geo-release delete 0.2.0 --force

  # Upload an avatar
  geo-release avatar upload ./silan.png

  # List all avatars
  geo-release avatar list

  # Delete an avatar
  geo-release avatar delete --filename abc123.png --force

JSON file format (notes.json / detail.json):
  {
    "en": "English content",
    "zh": "Chinese content",
    "ja": "Japanese content",
    "ko": "Korean content",
    "fr": "French content",
    "de": "German content",
    "es": "Spanish content"
  }
        """
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # config
    config_parser = subparsers.add_parser("config", help="Configure remote server")
    config_parser.add_argument("--server", "-s", help="Release server URL")
    config_parser.add_argument("--key", "-k", help="API key for authentication")
    config_parser.add_argument("--show", action="store_true", help="Show current configuration")

    # push
    push_parser = subparsers.add_parser("push", help="Push a new release")
    push_parser.add_argument("version", help="Version number (e.g., 0.2.0)")
    push_parser.add_argument("--notes", help="Release notes (JSON or simple string)")
    push_parser.add_argument("--notes-file", help="Release notes JSON file")
    push_parser.add_argument("--detail", help="Detailed changelog (JSON or simple string)")
    push_parser.add_argument("--detail-file", help="Detailed changelog JSON file")
    push_parser.add_argument("--author", help='Author info (JSON or name string)')
    push_parser.add_argument("--default-lang", default="en", help="Default language for simple strings")
    push_parser.add_argument("--critical", action="store_true", help="Mark as critical update")
    push_parser.add_argument("--prerelease", action="store_true", help="Mark as pre-release")
    push_parser.add_argument("--min-version", help="Minimum required version")

    # upload
    upload_parser = subparsers.add_parser("upload", help="Upload a build file")
    upload_parser.add_argument("file", help="Path to the build file")
    upload_parser.add_argument("--target", "-t", required=True, choices=["darwin", "windows", "linux"],
                               help="Target OS")
    upload_parser.add_argument("--arch", "-a", required=True, choices=["x86_64", "aarch64"],
                               help="Architecture")
    upload_parser.add_argument("--version", "-v", help="Associate with release version")
    upload_parser.add_argument("--filename", "-f", help="Override filename")
    upload_parser.add_argument("--signature", help="Tauri signature content (inline)")
    upload_parser.add_argument("--signature-file", help="Tauri signature file (.sig)")

    # list
    list_parser = subparsers.add_parser("list", help="List all releases")
    list_parser.add_argument("--active", action="store_true", help="Show only active releases")

    # log
    log_parser = subparsers.add_parser("log", help="Show changelog")
    log_parser.add_argument("version", nargs="?", help="Specific version (optional)")
    log_parser.add_argument("--lang", "-l", default="en", help="Language code (en, zh, ja, ko, fr, de, es, ...)")
    log_parser.add_argument("--limit", "-n", type=int, default=10, help="Number of releases to show")
    log_parser.add_argument("--detail", "-d", action="store_true", help="Show detailed changelog")

    # update
    update_parser = subparsers.add_parser("update", help="Update release info")
    update_parser.add_argument("version", help="Version to update")
    update_parser.add_argument("--notes", help="Update notes (JSON or simple string, merges with existing)")
    update_parser.add_argument("--notes-file", help="Update notes from JSON file")
    update_parser.add_argument("--detail", help="Update detail (JSON or simple string, merges with existing)")
    update_parser.add_argument("--detail-file", help="Update detail from JSON file")
    update_parser.add_argument("--author", help='Update author info (JSON or name string)')
    update_parser.add_argument("--default-lang", default="en", help="Default language for simple strings")
    update_parser.add_argument("--active", type=lambda x: x.lower() == "true", help="Set active status (true/false)")
    update_parser.add_argument("--critical", type=lambda x: x.lower() == "true", help="Set critical flag (true/false)")
    update_parser.add_argument("--prerelease", type=lambda x: x.lower() == "true", help="Set prerelease flag (true/false)")

    # changelog (add changelog entry)
    changelog_parser = subparsers.add_parser("changelog", help="Add changelog entry")
    changelog_parser.add_argument("version", help="Version to add changelog entry")
    changelog_parser.add_argument("--type", "-t", default="improve",
                                  choices=["feature", "improve", "fix", "breaking", "security", "deprecated"],
                                  help="Change type")
    changelog_parser.add_argument("--text", required=True, help="Multi-language text (JSON or simple string)")
    changelog_parser.add_argument("--default-lang", default="en", help="Default language for simple strings")
    changelog_parser.add_argument("--issue", help="GitHub Issue URL")
    changelog_parser.add_argument("--pr", help="GitHub PR URL")
    changelog_parser.add_argument("--commit", help="Git commit hash")

    # delete
    delete_parser = subparsers.add_parser("delete", help="Delete a release")
    delete_parser.add_argument("version", help="Version to delete")
    delete_parser.add_argument("--force", "-f", action="store_true", help="Skip confirmation")

    # avatar
    avatar_parser = subparsers.add_parser("avatar", help="Manage avatars")
    avatar_parser.add_argument("action", choices=["upload", "list", "delete"],
                               help="Action: upload, list, or delete")
    avatar_parser.add_argument("file", nargs="?", help="Image file to upload (for upload action)")
    avatar_parser.add_argument("--filename", help="Avatar filename (for delete action)")
    avatar_parser.add_argument("--force", "-f", action="store_true", help="Skip confirmation (for delete)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    commands = {
        "config": cmd_config,
        "push": cmd_push,
        "upload": cmd_upload,
        "list": cmd_list,
        "log": cmd_log,
        "update": cmd_update,
        "changelog": cmd_changelog,
        "delete": cmd_delete,
        "avatar": cmd_avatar,
    }

    cmd_func = commands.get(args.command)
    if cmd_func:
        cmd_func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
