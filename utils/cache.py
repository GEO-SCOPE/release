# -*- coding: utf-8 -*-
"""
GEO-SCOPE.ai Release Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~

File: utils/cache.py
Description: Caching utilities module.
             Provides memory LRU cache and disk-based cache implementations
             using diskcache for high-concurrency and reliability in experiment
             data caching and LLM response caching scenarios.

Author: Silan.Hu
Email: silan.hu@u.nus.edu

Copyright (c) 2025-2026 GEO-SCOPE.ai. All rights reserved.
"""

import os
import json
import time
import hashlib
import threading
from typing import Dict, Any, Optional, Set

from cachetools import LRUCache
import diskcache as dc

from .logger import ModernLogger


class MemoryLRUCache:
    """
    Thread-safe LRU cache for in-memory caching.

    Built on top of cachetools.LRUCache with thread-safe operations
    for concurrent access patterns.

    Attributes:
        _cache: Internal LRU cache instance.
        _lock: Reentrant lock for thread safety.
    """

    def __init__(self, max_size: int = 1000):
        """
        Initialize memory LRU cache.

        Args:
            max_size: Maximum number of items to cache.
        """
        self._cache = LRUCache(maxsize=max_size)
        self._lock = threading.RLock()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached value by key.

        Args:
            key: Cache key to look up.

        Returns:
            Cached value if found, None otherwise.
        """
        with self._lock:
            return self._cache.get(key)

    def put(self, key: str, value: Dict[str, Any]):
        """
        Store value in cache.

        Args:
            key: Cache key.
            value: Value to cache.
        """
        with self._lock:
            self._cache[key] = value

    def clear(self):
        """Clear all cached items."""
        with self._lock:
            self._cache.clear()

    @property
    def size(self) -> int:
        """
        Get current cache size.

        Returns:
            Number of items in cache.
        """
        with self._lock:
            return len(self._cache)


class ExperimentCache(ModernLogger):
    """
    Disk-backed cache for experiment data with memory LRU layer.

    Uses diskcache to improve concurrency and reliability:
    - Each cache_file is a "namespace"
    - Each record is stored at the granularity of (namespace, cache_key)
    - Maintains a namespace index key set for load/clear/list operations

    Attributes:
        base_dir: Base directory for cache storage.
        cache_dir: Directory containing cache files.
        enable_disk: Whether disk caching is enabled.
        memory_caches: Dictionary of per-namespace memory caches.
    """

    # Namespace index key prefix
    _NS_INDEX_PREFIX = "__NS_INDEX__:"  # __NS_INDEX__:namespace -> set(keys)
    _NS_META_PREFIX = "__NS_META__:"    # __NS_META__:namespace -> metadata(json)
    _NS_LIST_PREFIX = "oracle_cache_"   # Prefix for list/clear operations

    def __init__(self, base_dir: str = None,
                 memory_cache_size: int = 1000,
                 write_batch_size: int = 10,     # No-op (kept for API compatibility)
                 write_interval: float = 5.0,    # No-op (kept for API compatibility)
                 enable_disk: bool = True):
        """
        Initialize experiment cache.

        Args:
            base_dir: Base directory for cache storage (defaults to cwd).
            memory_cache_size: Maximum size of memory LRU cache per namespace.
            write_batch_size: Deprecated parameter (kept for compatibility).
            write_interval: Deprecated parameter (kept for compatibility).
            enable_disk: Whether to enable disk caching.
        """
        super().__init__(name="ExperimentCache")

        if base_dir is None:
            base_dir = os.getcwd()

        self.base_dir = base_dir
        self.cache_dir = os.path.join(base_dir, '.cache')
        self.current_file = os.path.join(self.cache_dir, '.current')

        self.enable_disk = enable_disk

        # Memory LRU: cache hot keys locally for fast access
        self.memory_cache_size = memory_cache_size
        self.memory_caches: Dict[str, MemoryLRUCache] = {}
        self.memory_cache_lock = threading.RLock()

        if self.enable_disk:
            os.makedirs(self.cache_dir, exist_ok=True)
            self.dc_cache = dc.Cache(self.cache_dir)
        else:
            self.dc_cache = None  # type: ignore

    def _ns_index_key(self, namespace: str) -> str:
        """
        Generate namespace index key.

        Args:
            namespace: Namespace identifier.

        Returns:
            Index key string.
        """
        return f"{self._NS_INDEX_PREFIX}{namespace}"

    def _ns_meta_key(self, namespace: str) -> str:
        """
        Generate namespace metadata key.

        Args:
            namespace: Namespace identifier.

        Returns:
            Metadata key string.
        """
        return f"{self._NS_META_PREFIX}{namespace}"

    def _get_memory_cache(self, namespace: str) -> MemoryLRUCache:
        """
        Get or create memory cache for namespace.

        Args:
            namespace: Namespace identifier.

        Returns:
            MemoryLRUCache instance for the namespace.
        """
        with self.memory_cache_lock:
            if namespace not in self.memory_caches:
                self.memory_caches[namespace] = MemoryLRUCache(self.memory_cache_size)
            return self.memory_caches[namespace]

    def _dc_get(self, key: str, default=None):
        """
        Get value from disk cache.

        Args:
            key: Cache key.
            default: Default value if not found.

        Returns:
            Cached value or default.
        """
        if not self.enable_disk or self.dc_cache is None:
            return default
        return self.dc_cache.get(key, default=default)

    def _dc_set(self, key: str, value, expire: Optional[int] = None):
        """
        Set value in disk cache.

        Args:
            key: Cache key.
            value: Value to cache.
            expire: Optional expiration time in seconds.
        """
        if not self.enable_disk or self.dc_cache is None:
            return
        self.dc_cache.set(key, value, expire=expire)

    def _dc_delete(self, key: str):
        """
        Delete value from disk cache.

        Args:
            key: Cache key to delete.
        """
        if not self.enable_disk or self.dc_cache is None:
            return
        try:
            del self.dc_cache[key]
        except KeyError:
            pass

    def _ns_add_key(self, namespace: str, cache_key: str):
        """
        Add cache_key to namespace index set.

        Maintains the set of all keys belonging to a namespace
        for efficient listing and clearing operations.

        Args:
            namespace: Namespace identifier.
            cache_key: Key to add to the index.
        """
        if not self.enable_disk or self.dc_cache is None:
            return
        idx_key = self._ns_index_key(namespace)
        with self.dc_cache.transact():
            s: Set[str] = self.dc_cache.get(idx_key, default=set())
            if cache_key not in s:
                s.add(cache_key)
                self.dc_cache.set(idx_key, s)

    def _ns_get_all_keys(self, namespace: str) -> Set[str]:
        """
        Get all keys in a namespace.

        Args:
            namespace: Namespace identifier.

        Returns:
            Set of all cache keys in the namespace.
        """
        if not self.enable_disk or self.dc_cache is None:
            return set()
        return set(self._dc_get(self._ns_index_key(namespace), default=set()))

    def _ns_clear(self, namespace: str):
        """
        Clear all entries in a namespace.

        Args:
            namespace: Namespace to clear.
        """
        if not self.enable_disk or self.dc_cache is None:
            return
        keys = self._ns_get_all_keys(namespace)
        with self.dc_cache.transact():
            for k in keys:
                self._dc_delete(f"{namespace}::{k}")
            self._dc_delete(self._ns_index_key(namespace))
            self._dc_delete(self._ns_meta_key(namespace))

    def create_experiment_context(self, experiment_id: str = None, **context_data):
        """
        Create a new experiment context.

        Initializes experiment tracking with metadata and context information.

        Args:
            experiment_id: Unique experiment identifier (auto-generated if None).
            **context_data: Additional context key-value pairs.
        """
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)

        if experiment_id is None:
            experiment_id = time.strftime("%Y%m%d_%H%M%S")

        experiment_info = {
            'experiment_id': experiment_id,
            'start_time': time.strftime("%Y%m%d_%H%M%S"),
            'current_batch': None,
            'current_dataset': None,
            'current_solution': None,
            'current_repeat': None,
            **context_data
        }

        try:
            with open(self.current_file, 'w', encoding='utf-8') as f:
                json.dump(experiment_info, f, ensure_ascii=False, indent=2)
            self.info(f"Created experiment context: {self.current_file}")
        except Exception as e:
            self.warning(f"Failed to create experiment context: {str(e)}")

    def update_experiment_context(self, **updates):
        """
        Update existing experiment context.

        Args:
            **updates: Key-value pairs to update in the context.
        """
        if not os.path.exists(self.current_file):
            self.warning("No experiment context file found, creating new one")
            self.create_experiment_context(**updates)
            return

        try:
            with open(self.current_file, 'r', encoding='utf-8') as f:
                experiment_info = json.load(f)

            experiment_info.update(updates)

            with open(self.current_file, 'w', encoding='utf-8') as f:
                json.dump(experiment_info, f, ensure_ascii=False, indent=2)
        except Exception as e:
            self.warning(f"Failed to update experiment context: {str(e)}")

    def get_experiment_context(self) -> Dict[str, Any]:
        """
        Get current experiment context.

        Returns:
            Dictionary containing experiment context, or empty dict if none exists.
        """
        if not os.path.exists(self.current_file):
            return {}
        try:
            with open(self.current_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.warning(f"Failed to read experiment context: {str(e)}")
            return {}

    def get_cache_filename(self, model: str, cache_scope: str = "auto", include_batch: bool = True) -> str:
        """
        Generate cache filename based on model and scope.

        Args:
            model: Model name/identifier.
            cache_scope: Scope level ("auto", "experiment", "batch", "session", "global").
            include_batch: Whether to include batch number in filename.

        Returns:
            Full path to the cache file.
        """
        model_name = model.replace('-', '_').replace('.', '_')

        if cache_scope == "auto":
            context = self.get_experiment_context()
            if context and context.get('experiment_id'):
                experiment_id = context['experiment_id']
                if include_batch:
                    current_batch = context.get('current_batch', 0)
                    cache_filename = f"oracle_cache_{model_name}_{experiment_id}_batch_{current_batch}.json"
                else:
                    cache_filename = f"oracle_cache_{model_name}_{experiment_id}.json"
            else:
                cache_filename = f"oracle_cache_{model_name}_global.json"
        elif cache_scope == "experiment":
            context = self.get_experiment_context()
            experiment_id = context.get('experiment_id', 'unknown')
            cache_filename = f"oracle_cache_{model_name}_{experiment_id}.json"
        elif cache_scope == "batch":
            context = self.get_experiment_context()
            experiment_id = context.get('experiment_id', 'unknown')
            current_batch = context.get('current_batch', 'unknown')
            cache_filename = f"oracle_cache_{model_name}_{experiment_id}_batch_{current_batch}.json"
        elif cache_scope == "session":
            session_id = time.strftime("%Y%m%d_%H%M%S")
            cache_filename = f"oracle_cache_{model_name}_{session_id}.json"
        else:  # global
            cache_filename = f"oracle_cache_{model_name}_global.json"

        return os.path.join(self.cache_dir, cache_filename)

    def _namespace_from_path(self, cache_file: str) -> str:
        """
        Extract namespace from cache file path.

        Args:
            cache_file: Full path to cache file.

        Returns:
            Namespace string.
        """
        fname = os.path.basename(cache_file)
        return f"{self._NS_LIST_PREFIX}{fname}"

    def load_cache(self, cache_file: str) -> Dict[str, str]:
        """
        Load all cached data from a cache file.

        Args:
            cache_file: Path to the cache file.

        Returns:
            Dictionary of all cached key-value pairs.
        """
        namespace = self._namespace_from_path(cache_file)

        memory_cache = self._get_memory_cache(namespace)
        full_cache_key = f"__FULL_CACHE__{namespace}"
        cached_data = memory_cache.get(full_cache_key)
        if cached_data is not None:
            return cached_data

        if not self.enable_disk or self.dc_cache is None:
            memory_cache.put(full_cache_key, {})
            return {}

        result: Dict[str, Any] = {}
        keys = self._ns_get_all_keys(namespace)
        if not keys:
            memory_cache.put(full_cache_key, {})
            return {}

        for k in keys:
            v = self._dc_get(f"{namespace}::{k}")
            if v is not None:
                result[k] = v

        memory_cache.put(full_cache_key, result.copy())
        return result

    def save_cache(self, cache_file: str, cache_data: Dict[str, str]):
        """
        Save cache data to a cache file.

        Args:
            cache_file: Path to the cache file.
            cache_data: Dictionary of key-value pairs to cache.
        """
        namespace = self._namespace_from_path(cache_file)

        memory_cache = self._get_memory_cache(namespace)
        full_cache_key = f"__FULL_CACHE__{namespace}"
        memory_cache.put(full_cache_key, cache_data.copy())

        if not self.enable_disk or self.dc_cache is None:
            return

        with self.dc_cache.transact():
            for k, v in cache_data.items():
                self._dc_set(f"{namespace}::{k}", v)
                self._ns_add_key(namespace, k)

            meta = {
                "namespace": namespace,
                "updated_at": time.time(),
                "count": len(cache_data),
            }
            self._dc_set(self._ns_meta_key(namespace), meta)

    def cleanup_experiment_context(self):
        """Clean up experiment context file."""
        if os.path.exists(self.current_file):
            try:
                os.remove(self.current_file)
                self.info("Cleaned up experiment context file")
            except Exception as e:
                self.warning(f"Failed to cleanup experiment context: {str(e)}")

    def list_cache_files(self) -> list:
        """
        List all cache files.

        Returns:
            List of cache file paths.
        """
        results = []
        if not self.enable_disk or self.dc_cache is None:
            with self.memory_cache_lock:
                for ns in self.memory_caches.keys():
                    if ns.startswith(self._NS_LIST_PREFIX):
                        fname = ns[len(self._NS_LIST_PREFIX):]
                        results.append(os.path.join(self.cache_dir, fname))
            return results

        for key in self.dc_cache.iterkeys():
            if isinstance(key, str) and key.startswith(self._NS_META_PREFIX):
                namespace = key[len(self._NS_META_PREFIX):]
                if namespace.startswith(self._NS_LIST_PREFIX):
                    fname = namespace[len(self._NS_LIST_PREFIX):]
                    results.append(os.path.join(self.cache_dir, fname))
        return results

    def clear_cache(self, model: str = None):
        """
        Clear cache for a specific model or all models.

        Args:
            model: Model name to clear cache for (None clears all).
        """
        targets = self.list_cache_files()
        cleared_count = 0

        for cache_path in targets:
            base = os.path.basename(cache_path)
            if (model is None) or (f"oracle_cache_{model.replace('-', '_')}" in base):
                namespace = self._namespace_from_path(cache_path)
                with self.memory_cache_lock:
                    if namespace in self.memory_caches:
                        self.memory_caches[namespace].clear()
                        del self.memory_caches[namespace]
                self._ns_clear(namespace)
                cleared_count += 1
                self.info(f"Cleared cache namespace: {namespace}")

        self.info(f"Cleared {cleared_count} cache files")

    def flush_all_pending_writes(self):
        """Flush all pending writes (no-op for diskcache implementation)."""
        return

    def shutdown(self):
        """
        Shutdown cache manager and release resources.

        Clears all memory caches and closes disk cache connection.
        """
        with self.memory_cache_lock:
            for memory_cache in self.memory_caches.values():
                memory_cache.clear()
            self.memory_caches.clear()

        if self.enable_disk and self.dc_cache is not None:
            try:
                self.dc_cache.close()
            except Exception as e:
                self.warning(f"Failed to close diskcache: {e}")

        self.info("Cache manager shutdown completed")

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary containing cache statistics.
        """
        stats = {
            "memory_caches_count": 0,
            "pending_writes_count": 0,  # No-op
            "memory_cache_sizes": {},
            "namespaces_count": 0,
            "items_count_estimate": 0,
            "disk_enabled": bool(self.enable_disk),
        }

        with self.memory_cache_lock:
            stats["memory_caches_count"] = len(self.memory_caches)
            for ns, mc in self.memory_caches.items():
                stats["memory_cache_sizes"][ns] = mc.size

        if self.enable_disk and self.dc_cache is not None:
            ns_cnt = 0
            item_cnt = 0
            for key in self.dc_cache.iterkeys():
                if isinstance(key, str) and key.startswith(self._NS_META_PREFIX):
                    ns_cnt += 1
                elif isinstance(key, str) and "::" in key:
                    item_cnt += 1
            stats["namespaces_count"] = ns_cnt
            stats["items_count_estimate"] = item_cnt

        return stats

    def generate_cache_key(self, model: str, prompt_sys: str, prompt_user: str,
                           temp: float = 0.0, top_p: float = 0.9) -> str:
        """
        Generate unique cache key for LLM query.

        Args:
            model: Model name.
            prompt_sys: System prompt.
            prompt_user: User prompt.
            temp: Temperature parameter.
            top_p: Top-p parameter.

        Returns:
            MD5 hash string as cache key.
        """
        deepinfra_models = ['llama-3-8B', 'llama-3-70B', 'mixtral-8x7B']
        api_provider = "deepinfra" if model in deepinfra_models else "openai"
        cache_string = f"{model}|{api_provider}|{prompt_sys}|{prompt_user}|{temp}|{top_p}"
        return hashlib.md5(cache_string.encode('utf-8')).hexdigest()

    def get_cached_response(self, model: str, prompt_sys: str, prompt_user: str,
                            temp: float = 0.0, top_p: float = 0.9,
                            cache_scope: str = "auto", include_batch: bool = True) -> Dict[str, Any]:
        """
        Get cached LLM response.

        Args:
            model: Model name.
            prompt_sys: System prompt.
            prompt_user: User prompt.
            temp: Temperature parameter.
            top_p: Top-p parameter.
            cache_scope: Cache scope level.
            include_batch: Whether to include batch in cache key.

        Returns:
            Cached response dictionary, or empty dict if not found.
        """
        namespace = self._namespace_from_path(
            self.get_cache_filename(model, cache_scope, include_batch)
        )
        cache_key = self.generate_cache_key(model, prompt_sys, prompt_user, temp, top_p)

        # Check memory cache first
        memory_cache = self._get_memory_cache(namespace)
        cached_response = memory_cache.get(cache_key)
        if cached_response is not None:
            return cached_response

        # Check disk cache
        if self.enable_disk and self.dc_cache is not None:
            v = self._dc_get(f"{namespace}::{cache_key}")
            if v is not None:
                # Fill memory cache for future lookups
                memory_cache.put(cache_key, v)
                return v

        return {}

    def store_cached_response(self, model: str, prompt_sys: str, prompt_user: str,
                              response: Dict[str, Any],
                              temp: float = 0.0, top_p: float = 0.9,
                              cache_scope: str = "auto", include_batch: bool = True):
        """
        Store LLM response in cache.

        Args:
            model: Model name.
            prompt_sys: System prompt.
            prompt_user: User prompt.
            response: Response to cache.
            temp: Temperature parameter.
            top_p: Top-p parameter.
            cache_scope: Cache scope level.
            include_batch: Whether to include batch in cache key.
        """
        namespace = self._namespace_from_path(
            self.get_cache_filename(model, cache_scope, include_batch)
        )
        cache_key = self.generate_cache_key(model, prompt_sys, prompt_user, temp, top_p)

        memory_cache = self._get_memory_cache(namespace)
        memory_cache.put(cache_key, response)

        if self.enable_disk and self.dc_cache is not None:
            with self.dc_cache.transact():
                self._dc_set(f"{namespace}::{cache_key}", response)
                self._ns_add_key(namespace, cache_key)

            full_cache = self.load_cache(os.path.join(self.cache_dir, namespace[len(self._NS_LIST_PREFIX):]))
            full_cache[cache_key] = response
            memory_cache.put(f"__FULL_CACHE__{namespace}", full_cache.copy())
