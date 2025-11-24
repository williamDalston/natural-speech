"""
Rate limiting middleware for API endpoints.
Uses token bucket algorithm for rate limiting.
"""
import time
from typing import Dict, Optional
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import threading

class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(self, requests_per_minute: int = 60, burst_size: Optional[int] = None):
        self.requests_per_minute = requests_per_minute
        self.tokens_per_second = requests_per_minute / 60.0
        self.burst_size = burst_size or requests_per_minute
        self.buckets: Dict[str, tuple] = {}  # client_id -> (tokens, last_update)
        self.lock = threading.Lock()
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier (IP address)"""
        # Try to get real IP from headers (for reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def is_allowed(self, request: Request) -> bool:
        """Check if request is allowed based on rate limit"""
        client_id = self._get_client_id(request)
        now = time.time()
        
        with self.lock:
            if client_id not in self.buckets:
                # Initialize bucket
                self.buckets[client_id] = (self.burst_size, now)
                return True
            
            tokens, last_update = self.buckets[client_id]
            
            # Add tokens based on time elapsed
            elapsed = now - last_update
            tokens = min(self.burst_size, tokens + elapsed * self.tokens_per_second)
            
            if tokens >= 1.0:
                # Consume one token
                tokens -= 1.0
                self.buckets[client_id] = (tokens, now)
                return True
            else:
                # Not enough tokens
                self.buckets[client_id] = (tokens, now)
                return False
    
    def get_retry_after(self, request: Request) -> float:
        """Get seconds until next request is allowed"""
        client_id = self._get_client_id(request)
        now = time.time()
        
        with self.lock:
            if client_id not in self.buckets:
                return 0.0
            
            tokens, last_update = self.buckets[client_id]
            elapsed = now - last_update
            tokens = min(self.burst_size, tokens + elapsed * self.tokens_per_second)
            
            if tokens >= 1.0:
                return 0.0
            
            # Calculate time needed to get one token
            needed = 1.0 - tokens
            return needed / self.tokens_per_second
    
    def cleanup_old_buckets(self, max_age_seconds: int = 3600):
        """Remove old rate limit buckets"""
        now = time.time()
        with self.lock:
            to_remove = [
                client_id for client_id, (_, last_update) in self.buckets.items()
                if now - last_update > max_age_seconds
            ]
            for client_id in to_remove:
                del self.buckets[client_id]

class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app, rate_limiter: RateLimiter):
        super().__init__(app)
        self.rate_limiter = rate_limiter
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health/status endpoints
        if request.url.path in ["/", "/api/health", "/api/status", "/api/metrics", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        if not self.rate_limiter.is_allowed(request):
            retry_after = self.rate_limiter.get_retry_after(request)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {retry_after:.1f} seconds.",
                headers={"Retry-After": str(int(retry_after) + 1)}
            )
        
        response = await call_next(request)
        return response

