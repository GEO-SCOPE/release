# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/lang2text.py
Description: Language code to display text conversion utility.
             Provides mapping from ISO language codes to human-readable
             language names for multi-language release notes support.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""


def lang2text(lang: str) -> str:
    """
    Convert language code to display text.

    Converts ISO 639-1 language codes to their corresponding
    human-readable language names.

    Args:
        lang: ISO 639-1 language code (e.g., "en", "zh", "ja").

    Returns:
        Human-readable language name, or the original code if not found.
    """
    if lang == "zh":
        return "Chinese"
    elif lang == "en":
        return "English"
    elif lang == "ja":
        return "Japanese"
    elif lang == "ko":
        return "Korean"
    elif lang == "de":
        return "Deutsch"
    elif lang == "fr":
        return "Français"
    elif lang == "es":
        return "Español"
    else:
        return lang
