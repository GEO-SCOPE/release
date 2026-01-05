# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/parallel.py
Description: High-throughput parallel processing utilities.
             Provides asyncio-based parallel processor with rate limiting,
             retry logic, and progress tracking for batch processing tasks
             like LLM queries and file operations.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import os
import asyncio
import threading
import functools
from typing import List, Tuple, Callable, Any, Optional

from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type
from aiolimiter import AsyncLimiter

from .logger import ModernLogger


class ParallelProcessor(ModernLogger):
    """
    High-throughput parallel processor using asyncio + aiolimiter + tenacity.

    Provides parallel processing capabilities with:
    - Support for both async and sync process functions
    - Retry with exponential backoff and jitter
    - Optional rate limiting
    - Progress tracking with Rich progress bars

    Attributes:
        Inherits all attributes from ModernLogger.
    """

    def __init__(self):
        """Initialize parallel processor with logger."""
        ModernLogger.__init__(self, name="ParallelProcessor")

    # ---- Worker and batching helpers ---- #

    def determine_worker_count(self, workers: Optional[int] = None) -> int:
        """
        Determine optimal worker count for parallel processing.

        For I/O bound tasks, defaults to 2x CPU cores (max 128).

        Args:
            workers: Optional explicit worker count.

        Returns:
            Number of workers to use.
        """
        default_workers = min((os.cpu_count() or 4) * 2, 128)
        return default_workers if workers is None else max(1, int(workers))

    def create_batches(self, items: List[Any], batch_size: int) -> List[Tuple[List[int], List[Any]]]:
        """
        Create batches from a list of items.

        Dynamically adjusts batch size based on total item count
        for optimal processing efficiency.

        Args:
            items: List of items to batch.
            batch_size: Base batch size.

        Returns:
            List of tuples containing (indices, batch_items).
        """
        total = len(items)
        if total > 1000:
            batch_size = max(batch_size, total // 50)
        elif total < 50:
            batch_size = max(1, max(1, total // 4))
        return [
            (list(range(i, min(i + batch_size, total))), items[i:i + batch_size])
            for i in range(0, total, batch_size)
        ]

    # ---- Retry wrapper ---- #

    def _make_retry_async(self, func: Callable[..., Any], *, max_retries: int):
        """
        Wrap function with retry logic using exponential backoff and jitter.

        Works for both sync and async functions, converting sync functions
        to async via run_in_executor.

        Args:
            func: Function to wrap.
            max_retries: Maximum number of retry attempts.

        Returns:
            Async function with retry logic.
        """
        is_coro = asyncio.iscoroutinefunction(func)

        if is_coro:
            @retry(
                reraise=True,
                stop=stop_after_attempt(max_retries + 1),
                wait=wait_exponential_jitter(exp_base=2, max=8),
                retry=retry_if_exception_type(Exception),
            )
            async def safe_call(item, **kwargs):
                return await func(item, **kwargs)
        else:
            loop = asyncio.get_event_loop()

            @retry(
                reraise=True,
                stop=stop_after_attempt(max_retries + 1),
                wait=wait_exponential_jitter(exp_base=2, max=8),
                retry=retry_if_exception_type(Exception),
            )
            async def safe_call(item, **kwargs):
                bound = functools.partial(func, item, **kwargs)
                return await loop.run_in_executor(None, bound)

        return safe_call

    # ---- Run asyncio in any context ---- #

    def _run_asyncio(self, coro):
        """
        Run coroutine in a fresh event loop if already inside one.

        Ensures compatibility with Jupyter and other frameworks
        that may already have a running event loop.

        Args:
            coro: Coroutine to run.

        Returns:
            Result of the coroutine.
        """
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(coro)

        result_box = {}

        def _target():
            result_box['value'] = asyncio.run(coro)

        t = threading.Thread(target=_target, daemon=True)
        t.start()
        t.join()
        return result_box.get('value')

    # ---- Core async execution ---- #

    async def _async_process_all(
        self,
        items: List[Any],
        process_func: Callable,
        workers: int,
        task_description: str,
        max_retries: int,
        timeout: int,
        hide_progress: bool,
        rate_limit_per_sec: float,
        **kwargs
    ) -> List[Any]:
        """
        Process all items asynchronously with concurrency control.

        Core async implementation that handles semaphore-based concurrency,
        rate limiting, retries, and progress tracking.

        Args:
            items: List of items to process.
            process_func: Function to apply to each item.
            workers: Maximum concurrent workers.
            task_description: Description for progress bar.
            max_retries: Maximum retry attempts.
            timeout: Timeout per item in seconds.
            hide_progress: Whether to hide progress bar.
            rate_limit_per_sec: Rate limit (requests per second).
            **kwargs: Additional arguments for process_func.

        Returns:
            List of results in same order as input items.
        """
        total_items = len(items)
        if total_items == 0:
            self.info("No items to process.")
            return []

        # Progress tracking
        completed = 0
        lock = threading.Lock()
        if not hide_progress:
            progress, task_id = self.progress(total_items, task_description)
        else:
            progress, task_id = self.tmp_progress(total_items, task_description)

        # Concurrency limit and rate limiter
        sem = asyncio.Semaphore(workers)
        limiter = AsyncLimiter(rate_limit_per_sec, 1) if rate_limit_per_sec > 0 else None

        safe_call = self._make_retry_async(process_func, max_retries=max_retries)
        results: List[Optional[Any]] = [None] * total_items

        async def one(idx: int, item: Any):
            nonlocal completed
            if limiter is not None:
                async with limiter:
                    pass
            async with sem:
                try:
                    if timeout and timeout > 0:
                        res = await asyncio.wait_for(safe_call(item, **kwargs), timeout=timeout)
                    else:
                        res = await safe_call(item, **kwargs)
                    results[idx] = res
                except Exception as e:
                    self.error(f"Task {idx} failed after {max_retries} retries: {e}")
                    results[idx] = None
                finally:
                    with lock:
                        completed += 1
                        if completed % 10 == 0 or completed == total_items:
                            progress.update(task_id, completed=completed)

        tasks = [asyncio.create_task(one(i, item)) for i, item in enumerate(items)]

        with progress:
            try:
                await asyncio.gather(*tasks)
                progress.update(task_id, completed=total_items)
            except asyncio.CancelledError:
                self.warning("Cancelled by outer scope.")
            except Exception as e:
                self.error(f"Unexpected error during gather: {e}")

        return results

    # ---- Public API (unchanged signature) ---- #

    def process_batches(
        self,
        batches: List[Tuple[List[int], List[Any]]],
        workers: int,
        process_func: Callable,
        total_items: int,
        task_description: str = "Processing items",
        max_retries: int = 2,
        timeout: int = 18000,
        hide_progress: bool = False,
        **kwargs
    ) -> List[Any]:
        """
        Process pre-created batches in parallel.

        Args:
            batches: List of (indices, items) tuples from create_batches().
            workers: Number of worker threads.
            process_func: Function to apply to each item.
            total_items: Total number of items for progress tracking.
            task_description: Description for progress bar.
            max_retries: Maximum retry attempts per item.
            timeout: Timeout per item in seconds.
            hide_progress: Whether to hide progress bar.
            **kwargs: Additional arguments for process_func.

        Returns:
            List of results.
        """
        flat_items: List[Any] = []
        for _, batch in batches:
            flat_items.extend(batch)

        rate_limit_per_sec = float(kwargs.pop("rate_limit_per_sec", 0) or 0)

        return self._run_asyncio(
            self._async_process_all(
                items=flat_items,
                process_func=process_func,
                workers=workers,
                task_description=task_description,
                max_retries=max_retries,
                timeout=timeout,
                hide_progress=hide_progress,
                rate_limit_per_sec=rate_limit_per_sec,
                **kwargs
            )
        )

    def parallel_process(
        self,
        items: List[Any],
        process_func: Callable,
        workers: Optional[int] = None,
        batch_size: int = 20,
        max_retries: int = 2,
        timeout: int = 18000,
        task_description: str = "Processing items",
        hide_progress: bool = False,
        **kwargs
    ) -> List[Any]:
        """
        Process items in parallel with automatic batching.

        Main entry point for parallel processing. Automatically determines
        worker count and creates batches for optimal processing.

        Args:
            items: List of items to process.
            process_func: Function to apply to each item.
            workers: Number of worker threads (auto-determined if None).
            batch_size: Base batch size for grouping items.
            max_retries: Maximum retry attempts per item.
            timeout: Timeout per item in seconds.
            task_description: Description for progress bar.
            hide_progress: Whether to hide progress bar.
            **kwargs: Additional arguments for process_func.

        Returns:
            List of results in same order as input items.
        """
        workers = self.determine_worker_count(workers)
        batches = self.create_batches(items, batch_size)
        return self.process_batches(
            batches=batches,
            workers=workers,
            process_func=process_func,
            total_items=len(items),
            task_description=task_description,
            max_retries=max_retries,
            timeout=timeout,
            hide_progress=hide_progress,
            **kwargs
        )
