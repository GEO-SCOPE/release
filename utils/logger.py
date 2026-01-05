# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/logger.py
Description: Modern colorful logger with gradient styling.
             Built on top of the Rich library, provides beautiful console output
             with progress bars, panels, tables, and gradient text effects
             inspired by Vue CLI aesthetics.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

from pathlib import Path
from rich.console import Console
from rich.logging import RichHandler
from rich.traceback import install as install_rich_traceback
from rich.progress import (
    Progress,
    SpinnerColumn,
    BarColumn,
    TextColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.panel import Panel
from rich.text import Text
from rich.table import Table
from rich.box import ROUNDED
from rich.theme import Theme
import logging
import os
from typing import Any, Optional, Tuple
from pyfiglet import Figlet


class ModernLogger:
    """
    Modern colorful logger with smooth gradient styling inspired by Vue CLI.

    Built on top of the Rich library, provides beautiful console output
    including logging, progress bars, panels, tables, and gradient text effects.

    Attributes:
        LEVEL_ICONS: Emoji prefixes for each logging level.
        GRADIENT_START: Start color for gradient effects.
        GRADIENT_END: End color for gradient effects.
        console: Rich Console instance.
        logger: Python logger instance.
    """

    # Emoji prefixes for each level
    LEVEL_ICONS = {
        "DEBUG": "🐛",
        "INFO": "ℹ️",
        "WARNING": "⚠️",
        "ERROR": "❌",
        "CRITICAL": "💀"
    }

    # Hardcoded gradient endpoints
    GRADIENT_START = "#41B883"  # Vue green
    GRADIENT_END = "#6574CD"    # Vue purple

    def __init__(
        self,
        name: str = "app",
        level: str = "info",
        log_file: Optional[str] = None,
        show_path: bool = False,
        rich_tracebacks: bool = True
    ):
        """
        Initialize modern logger.

        Args:
            name: Logger name identifier.
            level: Logging level (debug, info, warning, error, critical).
            log_file: Optional file path for log output.
            show_path: Whether to show file path in log output.
            rich_tracebacks: Whether to enable rich traceback formatting.
        """
        # Enable rich tracebacks
        install_rich_traceback(show_locals=True)

        # Map text levels to logging levels
        levels = {
            "debug": logging.DEBUG,
            "info": logging.INFO,
            "warning": logging.WARNING,
            "error": logging.ERROR,
            "critical": logging.CRITICAL
        }
        log_level = levels.get(level.lower(), logging.INFO)

        # Define custom theme (directly using color/effect strings)
        custom_theme = Theme({
            "info": "bold cyan",
            "warning": "bold yellow",
            "error": "bold red",
            "critical": "bold white on red",
            "success": "#4CAF50",
            "vue_primary": "#42B883",
            "vue_secondary": "#35495E",
            "logging.time": "dim white",
            "logging.level.debug": "grey70",
            "logging.level.info": "bold cyan",
            "logging.level.warning": "bold yellow",
            "logging.level.error": "bold red",
            "logging.level.critical": "bold white on red",
        })

        # Set up console and handler
        self.console = Console(theme=custom_theme, highlight=True)
        rich_handler = RichHandler(
            console=self.console,
            show_time=True,
            show_level=True,
            show_path=show_path,
            markup=True,
            rich_tracebacks=rich_tracebacks,
            log_time_format="%H:%M:%S"
        )

        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        self.logger.handlers.clear()
        self.logger.addHandler(rich_handler)

        if log_file:
            self._setup_file_handler(log_file)

    def _setup_file_handler(self, log_file: str) -> None:
        """
        Set up file handler for logging.

        Args:
            log_file: Path to the log file.
        """
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
        fh = logging.FileHandler(log_file)
        fh.setFormatter(logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        ))
        self.logger.addHandler(fh)

    def _create_gradient_text(self, text: str) -> Text:
        """
        Create a smooth gradient across the text.

        Interpolates colors from GRADIENT_START to GRADIENT_END
        across each character of the text.

        Args:
            text: Text to apply gradient to.

        Returns:
            Rich Text object with gradient styling.
        """
        def hex_to_rgb(h: str) -> Tuple[int, int, int]:
            return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))

        start_rgb = hex_to_rgb(self.GRADIENT_START)
        end_rgb = hex_to_rgb(self.GRADIENT_END)
        length = len(text)
        grad_text = Text()

        for i, ch in enumerate(text):
            t = i / (length - 1) if length > 1 else 0
            r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * t)
            g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * t)
            b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * t)
            color = f"#{r:02X}{g:02X}{b:02X}"
            grad_text.append(ch, style=color)

        return grad_text

    # ---- Logging Level Methods ---- #

    def debug(self, message: str, *args: Any, **kwargs: Any) -> None:
        """
        Log a debug message.

        Args:
            message: Message to log.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        self.logger.debug(f"{self.LEVEL_ICONS['DEBUG']} {message}", *args, **kwargs)

    def info(self, message: str, *args: Any, **kwargs: Any) -> None:
        """
        Log an info message.

        Args:
            message: Message to log.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        self.logger.info(f"{self.LEVEL_ICONS['INFO']} {message}", *args, **kwargs)

    def warning(self, message: str, *args: Any, **kwargs: Any) -> None:
        """
        Log a warning message.

        Args:
            message: Message to log.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        self.logger.warning(f"{self.LEVEL_ICONS['WARNING']} {message}", *args, **kwargs)

    def error(self, message: str, *args: Any, **kwargs: Any) -> None:
        """
        Log an error message.

        Args:
            message: Message to log.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        self.logger.error(f"{self.LEVEL_ICONS['ERROR']} {message}", *args, **kwargs)

    def critical(self, message: str, *args: Any, **kwargs: Any) -> None:
        """
        Log a critical message.

        Args:
            message: Message to log.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        self.logger.critical(f"{self.LEVEL_ICONS['CRITICAL']} {message}", *args, **kwargs)

    def exception(self, message: str, *args: Any, **kwargs: Any) -> None:
        """
        Log an exception with traceback.

        Args:
            message: Message to log.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        self.logger.exception(f"{self.LEVEL_ICONS['ERROR']} {message}", *args, **kwargs)

    # ---- Rich Print Methods ---- #

    def print(self, *args: Any, **kwargs: Any) -> None:
        """
        Print using Rich console.

        Args:
            *args: Arguments to print.
            **kwargs: Keyword arguments for console.print().
        """
        self.console.print(*args, **kwargs)

    def progress(self, total: int = 100, description: str = "Processing") -> Tuple[Progress, int]:
        """
        Create a lively progress bar with smooth gradient fill.

        Shows elapsed time, estimated time remaining and completion status.

        Args:
            total: Total number of steps.
            description: Description text for the progress bar.

        Returns:
            Tuple of (Progress instance, task_id).
        """
        progress = Progress(
            SpinnerColumn("bouncingBall", style="vue_secondary"),
            TextColumn("[bold vue_primary]{task.description}"),
            BarColumn(complete_style=self.GRADIENT_START, finished_style=self.GRADIENT_END),
            TaskProgressColumn("[bold vue_secondary]{task.percentage:>3.0f}%"),
            TextColumn("{task.completed}/{task.total}"),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=self.console,
            expand=True
        )
        task_id = progress.add_task(description, total=total)
        return progress, int(task_id)

    def tmp_progress(self, total: int = 100, description: str = "Processing") -> Tuple[Progress, int]:
        """
        Create a temporary progress bar that auto-cleans after completion.

        The progress bar will be removed from display once the task is finished.

        Args:
            total: Total number of steps.
            description: Description text for the progress bar.

        Returns:
            Tuple of (Progress instance, task_id).
        """
        progress = Progress(
            SpinnerColumn("bouncingBall", style="vue_secondary"),
            TextColumn("[bold vue_primary]{task.description}"),
            BarColumn(complete_style=self.GRADIENT_START, finished_style=self.GRADIENT_END),
            TaskProgressColumn("[bold vue_secondary]{task.percentage:>3.0f}%"),
            TextColumn("{task.completed}/{task.total}"),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=self.console,
            expand=True,
            transient=True  # Makes the progress bar disappear after completion
        )
        task_id = progress.add_task(description, total=total)
        return progress, int(task_id)

    def stage(self, message: str) -> None:
        """
        Display a prominent stage marker with smooth gradient panel.

        Args:
            message: Stage message to display.
        """
        self.console.print()
        panel = Panel(
            self._create_gradient_text(f" {message} "),
            box=ROUNDED,
            border_style="vue_primary",
            expand=False,
            padding=(0, 2)
        )
        self.console.print(panel, justify="left")
        self.console.print()

    def highlight(self, message: str) -> None:
        """
        Print a star marker followed by gradient text.

        Args:
            message: Message to highlight.
        """
        txt = Text(" ★ ", style=f"bold {self.GRADIENT_START}")
        txt.append(self._create_gradient_text(message))
        self.console.print(txt)

    def success(self, message: str) -> None:
        """
        Print a green checkmark with message.

        Args:
            message: Success message to display.
        """
        txt = Text()
        txt.append(" ✓ ", style="bold green")
        txt.append(message, style="green")
        self.console.print(txt)

    def error_box(self, message: str) -> None:
        """
        Display an error message in a styled box.

        Args:
            message: Error message to display.
        """
        panel = Panel(
            message,
            title="ERROR",
            title_align="left",
            border_style="bold red",
            box=ROUNDED,
            padding=(1, 2)
        )
        self.console.print(panel)

    def section(self, message: str) -> None:
        """
        Print a gradient-colored rule with section title.

        Args:
            message: Section title to display.
        """
        self.console.print()
        header = self._create_gradient_text(f" {message} ")
        self.console.rule(header, style="vue_secondary", align="center")
        self.console.print()

    def info_panel(self, title: str, message: str) -> None:
        """
        Display information in a styled panel.

        Args:
            title: Panel title.
            message: Panel content.
        """
        panel = Panel(
            message,
            title=title,
            title_align="left",
            border_style="vue_primary",
            box=ROUNDED,
            padding=(1, 2)
        )
        self.console.print(panel)

    def gradient_text(self, message: str) -> None:
        """
        Print a standalone smooth-gradient text.

        Args:
            message: Text to display with gradient.
        """
        self.console.print(self._create_gradient_text(message))

    def table(self, title: Optional[str] = None) -> Table:
        """
        Create a styled table.

        Args:
            title: Optional table title.

        Returns:
            Rich Table instance.
        """
        tbl = Table(
            title=title,
            box=ROUNDED,
            title_style="bold vue_primary",
            border_style="vue_primary",
            header_style="bold"
        )
        return tbl

    # ---- File Save Notification ---- #

    def file_saved(self, file_path: str, file_name: Optional[str] = None) -> None:
        """
        Print "File saved" with path as clickable link.

        Args:
            file_path: Path to the saved file.
            file_name: Optional display name for the file.
        """
        uri = Path(file_path).resolve().as_uri()
        # Use Rich Markup to generate linked text
        if file_name:
            self.console.print(
                f"💾 ({file_name}) File saved: [link={uri}][bold blue]{file_path}[/bold blue][/link]"
            )
        else:
            self.console.print(
                f"💾 File saved: [link={uri}][bold blue]{file_path}[/bold blue][/link]"
            )

    def banner(self, project_name: str, title: str, description: str, font: str = "slant") -> None:
        """
        Print an ASCII Art Banner at program startup with gradient styling.

        Displays a project name in ASCII art followed by a description panel.

        Args:
            project_name: Name to render as ASCII art.
            title: Title for the description panel.
            description: Description text.
            font: Figlet font to use (default: "slant").
        """
        fig = Figlet(font=font)
        art = fig.renderText(project_name)

        # Apply character-level gradient to each line
        for line in art.splitlines():
            grad_line = self._create_gradient_text(line)
            self.console.print(grad_line)

        panel = Panel(
            description,
            title=f"[bold vue_primary]{title}",
            border_style="vue_primary",
            box=ROUNDED,
            padding=(1, 2),
        )
        self.console.print(panel)
