#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEO-SCOPE Release CLI - Setup Configuration

This module provides the setuptools configuration for installing
the GEO-SCOPE Release CLI as a command-line tool.

Installation:
    pip install -e .

After installation, the 'geo-release' command will be available
in your terminal for managing GEO-SCOPE releases.

Author: Silan Hu
Email: silan.hu@u.nus.edu
Version: 1.0.0
Created: 2026-01-04
Modified: 2026-01-05
"""

from setuptools import setup, find_packages

setup(
    name="geo-release",
    version="1.0.0",
    description="GEO-SCOPE Release CLI - Release management tool with multi-language support",
    author="Silan Hu",
    author_email="silan.hu@u.nus.edu",
    python_requires=">=3.9",
    py_modules=["cli"],
    install_requires=[
        "requests>=2.31.0",
    ],
    entry_points={
        "console_scripts": [
            "geo-release=cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
