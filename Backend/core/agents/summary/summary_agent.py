# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: core/agents/summary/summary_agent.py
Description: Summary Agent for generating release summaries from git commits.
             Uses LLM to analyze commit messages and generate multi-language
             release notes, changelogs, and detailed descriptions.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2024-2025 GEO-SCOPE.ai. All rights reserved.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

from ..base.base_agent import BaseAgent
from core.database import session_scope
from models.entities import Author, Release, ChangelogEntry


@dataclass
class CommitInfo:
    """
    Git commit information.

    Attributes:
        hash: Full commit hash.
        message: Commit message text.
        author: Commit author name (optional).
        date: Commit date string (optional).
    """
    hash: str
    message: str
    author: Optional[str] = None
    date: Optional[str] = None


@dataclass
class ReleaseSummary:
    """
    Generated release summary.

    Attributes:
        version: Version number string.
        date: Release date (YYYY-MM-DD format).
        notes: Multi-language short notes dict.
        detail: Multi-language detailed changelog dict.
        changelogs: List of changelog entry dicts.
    """
    version: str
    date: str
    notes: Dict[str, str] = field(default_factory=dict)
    detail: Dict[str, str] = field(default_factory=dict)
    changelogs: List[Dict[str, Any]] = field(default_factory=list)


class SummaryAgent(BaseAgent):
    """
    Agent for generating release summaries from git commits.

    Uses LLM to analyze git commit messages and generate structured
    release documentation including notes, changelogs, and detailed
    descriptions in multiple languages.

    Attributes:
        name: Agent name identifier.
        DEFAULT_MODEL: Default LLM model (gpt-4o-mini for cost efficiency).
    """

    name = "summary_agent"
    DEFAULT_MODEL = "gpt-4o-mini"

    def __init__(
        self,
        prompts_dir: Optional[Path] = None,
        model: Optional[str] = None,
    ):
        """
        Initialize SummaryAgent.

        Args:
            prompts_dir: Path to prompts directory.
            model: LLM model name (defaults to gpt-4o-mini).
        """
        prompts_dir = prompts_dir or Path(__file__).parent.parent.parent / "prompts"
        model = model or self.DEFAULT_MODEL
        super().__init__(prompts_dir=prompts_dir, model=model)

    def generate_summary(
        self,
        version: str,
        commits: List[CommitInfo],
        date: Optional[str] = None,
    ) -> ReleaseSummary:
        """
        Generate release summary from git commits.

        Args:
            version: Version number (e.g., "0.18.0").
            commits: List of commit information.
            date: Release date (defaults to today).

        Returns:
            ReleaseSummary object with generated content.
        """
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Format commits for prompt
        commits_text = "\n".join([
            f"- {c.hash[:7]} {c.message}" for c in commits
        ])

        # Load and format prompt
        prompt_template = self._load_prompt("release_summary.md")

        # Build user prompt
        user_prompt = f"""
Version: {version}
Date: {date}

Commits:
{commits_text}

Please generate the release summary JSON.
"""

        # Query LLM
        response = self.query(prompt_template, user_prompt, temperature=0.3)

        # Parse JSON response
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response

            data = json.loads(json_str)

            return ReleaseSummary(
                version=version,
                date=date,
                notes=data.get("notes", {}),
                detail=data.get("detail", {}),
                changelogs=data.get("changelogs", []),
            )
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse LLM response: {e}")
            # Return minimal summary on parse error
            return ReleaseSummary(
                version=version,
                date=date,
                notes={"en": "Version update", "zh": "Version update"},
                detail={"en": f"# v{version}", "zh": f"# v{version}"},
                changelogs=[
                    {
                        "type": "improve",
                        "title": {"en": c.message, "zh": c.message},
                        "detail": {"en": c.message, "zh": c.message},
                        "commit_hash": c.hash[:7],
                    }
                    for c in commits
                ],
            )

    def save_to_database(
        self,
        summary: ReleaseSummary,
        author_username: str = "silan",
    ) -> Release:
        """
        Save the generated summary to the database.

        If version exists, APPEND new changelogs (skip duplicates by commit_hash).
        This supports multiple pushes per day accumulating changelogs.

        Args:
            summary: ReleaseSummary object.
            author_username: Username of the author.

        Returns:
            Created/Updated Release object.
        """
        with session_scope() as session:
            # Get author
            author = session.query(Author).filter_by(username=author_username).first()

            # Check if version already exists
            existing = session.query(Release).filter_by(version=summary.version).first()
            if existing:
                # Update existing release - APPEND changelogs instead of replace
                existing.pub_date = datetime.strptime(summary.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

                # Get existing commit hashes to avoid duplicates
                existing_hashes = {cl.commit_hash for cl in existing.changelogs if cl.commit_hash}

                # Get max order for new entries
                max_order = max((cl.order for cl in existing.changelogs), default=-1)

                # Add new changelogs (skip duplicates)
                new_changelogs = []
                for cl_data in summary.changelogs:
                    commit_hash = cl_data.get("commit_hash")
                    if commit_hash and commit_hash in existing_hashes:
                        self.logger.info(f"Skipping duplicate changelog: {commit_hash}")
                        continue

                    max_order += 1
                    entry = ChangelogEntry(
                        release_id=existing.id,
                        type=cl_data.get("type", "improve"),
                        title=cl_data.get("title", {}),
                        detail=cl_data.get("detail"),
                        commit_hash=commit_hash,
                        author_id=author.id if author else None,
                        order=max_order,
                    )
                    session.add(entry)
                    new_changelogs.append(entry)

                # Update notes and detail to reflect all changelogs
                if new_changelogs:
                    # Merge notes (keep latest summary)
                    existing.notes = self._merge_notes(existing.notes, summary.notes)
                    existing.detail = self._merge_detail(existing.detail, summary.detail)

                session.commit()
                self.logger.info(f"Updated v{summary.version}: added {len(new_changelogs)} changelogs")
                return existing
            else:
                # Create new release
                release = Release(
                    version=summary.version,
                    pub_date=datetime.strptime(summary.date, "%Y-%m-%d").replace(tzinfo=timezone.utc),
                    notes=summary.notes,
                    detail=summary.detail,
                    author_id=author.id if author else None,
                    is_active=True,
                )
                session.add(release)
                session.flush()  # Get release.id

                # Add changelogs
                for idx, cl_data in enumerate(summary.changelogs):
                    entry = ChangelogEntry(
                        release_id=release.id,
                        type=cl_data.get("type", "improve"),
                        title=cl_data.get("title", {}),
                        detail=cl_data.get("detail"),
                        commit_hash=cl_data.get("commit_hash"),
                        author_id=author.id if author else None,
                        order=idx,
                    )
                    session.add(entry)

                session.commit()
                self.logger.info(f"Created v{summary.version} with {len(summary.changelogs)} changelogs")
                return release

    def _merge_notes(self, old_notes: Dict[str, str], new_notes: Dict[str, str]) -> Dict[str, str]:
        """
        Merge release notes by combining summaries.

        Args:
            old_notes: Existing notes dict.
            new_notes: New notes dict to merge.

        Returns:
            Merged notes dict.
        """
        merged = {}
        for lang in set(list(old_notes.keys()) + list(new_notes.keys())):
            old_text = old_notes.get(lang, "")
            new_text = new_notes.get(lang, "")
            if old_text and new_text and old_text != new_text:
                # Combine with separator
                merged[lang] = f"{old_text}; {new_text}"
            else:
                merged[lang] = new_text or old_text
        return merged

    def _merge_detail(self, old_detail: Dict[str, str], new_detail: Dict[str, str]) -> Dict[str, str]:
        """
        Merge release details by appending new sections.

        Args:
            old_detail: Existing detail dict.
            new_detail: New detail dict to merge.

        Returns:
            Merged detail dict.
        """
        merged = {}
        for lang in set(list(old_detail.keys()) + list(new_detail.keys())):
            old_text = old_detail.get(lang, "")
            new_text = new_detail.get(lang, "")
            if old_text and new_text:
                # Extract sections from new_text and append to old
                # Skip the header line (# GEO-SCOPE v...)
                new_lines = new_text.split('\n')
                # Find content after header
                content_start = 0
                for i, line in enumerate(new_lines):
                    if line.startswith('## '):
                        content_start = i
                        break
                new_content = '\n'.join(new_lines[content_start:])
                merged[lang] = f"{old_text}\n{new_content}" if new_content else old_text
            else:
                merged[lang] = new_text or old_text
        return merged

    def generate_and_save(
        self,
        version: str,
        commits: List[CommitInfo],
        date: Optional[str] = None,
        author_username: str = "silan",
    ) -> Release:
        """
        Generate summary and save to database in one step.

        Args:
            version: Version number.
            commits: List of commit information.
            date: Release date.
            author_username: Author username.

        Returns:
            Created/Updated Release object.
        """
        summary = self.generate_summary(version, commits, date)
        return self.save_to_database(summary, author_username)


def create_summary_agent(model: Optional[str] = None) -> SummaryAgent:
    """
    Factory function for creating SummaryAgent instance.

    Args:
        model: Optional LLM model name.

    Returns:
        SummaryAgent instance.
    """
    return SummaryAgent(model=model)
