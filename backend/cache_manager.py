"""
Caching system for voices list and audio generations.
Uses in-memory cache with optional Redis support.
"""
import hashlib
import json
import os
import time
from typing import Optional, Dict, Any
from functools import wraps
import threading

class CacheManager:
    """Manages caching for API responses and generated content"""
    
    def __init__(self, cache_dir: str = "cache", ttl: int = 3600):
        self.cache_dir = cache_dir
        self.ttl = ttl  # Time to live in seconds
        self.memory_cache: Dict[str, tuple] = {}  # key -> (value, timestamp)
        self.lock = threading.Lock()
        os.makedirs(cache_dir, exist_ok=True)
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate a cache key from arguments"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self.lock:
            # Check memory cache first
            if key in self.memory_cache:
                value, timestamp = self.memory_cache[key]
                if time.time() - timestamp < self.ttl:
                    return value
                else:
                    # Expired, remove it
                    del self.memory_cache[key]
            
            # Check file cache
            cache_file = os.path.join(self.cache_dir, f"{key}.cache")
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        data = json.load(f)
                        if time.time() - data['timestamp'] < self.ttl:
                            # Also store in memory cache
                            self.memory_cache[key] = (data['value'], data['timestamp'])
                            return data['value']
                        else:
                            # Expired, remove file
                            os.remove(cache_file)
                except (json.JSONDecodeError, KeyError, IOError):
                    # Corrupted cache file, remove it
                    if os.path.exists(cache_file):
                        os.remove(cache_file)
        
        return None
    
    def set(self, key: str, value: Any):
        """Store value in cache"""
        timestamp = time.time()
        
        with self.lock:
            # Store in memory cache
            self.memory_cache[key] = (value, timestamp)
            
            # Store in file cache
            cache_file = os.path.join(self.cache_dir, f"{key}.cache")
            try:
                with open(cache_file, 'w') as f:
                    json.dump({"value": value, "timestamp": timestamp}, f)
            except IOError:
                # If file write fails, at least we have memory cache
                pass
    
    def invalidate(self, key: str):
        """Remove a specific cache entry"""
        with self.lock:
            # Remove from memory
            if key in self.memory_cache:
                del self.memory_cache[key]
            
            # Remove from file
            cache_file = os.path.join(self.cache_dir, f"{key}.cache")
            if os.path.exists(cache_file):
                os.remove(cache_file)
    
    def clear(self):
        """Clear all cache"""
        with self.lock:
            self.memory_cache.clear()
            
            # Remove all cache files
            for filename in os.listdir(self.cache_dir):
                if filename.endswith('.cache'):
                    os.remove(os.path.join(self.cache_dir, filename))
    
    def cache_result(self, ttl: Optional[int] = None):
        """Decorator to cache function results"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_ttl = ttl or self.ttl
                key = f"{func.__name__}:{self._generate_key(*args, **kwargs)}"
                
                # Try to get from cache
                cached = self.get(key)
                if cached is not None:
                    return cached
                
                # Compute result
                result = func(*args, **kwargs)
                
                # Store in cache
                original_ttl = self.ttl
                self.ttl = cache_ttl
                self.set(key, result)
                self.ttl = original_ttl
                
                return result
            return wrapper
        return decorator

