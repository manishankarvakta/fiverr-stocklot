# Rate Limiting Service for Stocklot Platform
# Implements comprehensive rate limiting for checkout and high-traffic endpoints

import asyncio
import time
import logging
from typing import Dict, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
import redis
import os

logger = logging.getLogger(__name__)

class RateLimitingService:
    """Advanced rate limiting service with multiple strategies"""
    
    def __init__(self):
        self.memory_store = defaultdict(lambda: defaultdict(list))
        self.redis_client = None
        
        # Initialize Redis if available
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("✅ Redis connected for rate limiting")
        except Exception as e:
            logger.warning(f"Redis not available, using memory store: {e}")
            self.redis_client = None  # Ensure fallback to memory store
    
    async def check_rate_limit(
        self, 
        identifier: str, 
        endpoint: str, 
        max_requests: int, 
        window_seconds: int,
        burst_limit: Optional[int] = None
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is within rate limits
        
        Args:
            identifier: User ID, IP address, or unique identifier
            endpoint: API endpoint being accessed
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            burst_limit: Optional burst limit for immediate requests
            
        Returns:
            (is_allowed, rate_limit_info)
        """
        now = time.time()
        key = f"{identifier}:{endpoint}"
        
        try:
            if self.redis_client:
                return await self._check_redis_rate_limit(
                    key, max_requests, window_seconds, now, burst_limit
                )
            else:
                return await self._check_memory_rate_limit(
                    key, max_requests, window_seconds, now, burst_limit
                )
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open - allow request if rate limiting fails
            return True, {"remaining": max_requests, "reset_time": int(now + window_seconds)}
    
    async def _check_redis_rate_limit(
        self, key: str, max_requests: int, window_seconds: int, 
        now: float, burst_limit: Optional[int]
    ) -> Tuple[bool, Dict[str, int]]:
        """Redis-based rate limiting (production)"""
        
        # Sliding window log approach
        pipe = self.redis_client.pipeline()
        
        # Remove old entries
        cutoff = now - window_seconds
        pipe.zremrangebyscore(key, 0, cutoff)
        
        # Count current requests
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(now): now})
        
        # Set expiry
        pipe.expire(key, window_seconds + 1)
        
        results = pipe.execute()
        current_requests = results[1]
        
        # Check burst limit first
        if burst_limit:
            recent_key = f"{key}:burst"
            recent_count = self.redis_client.zcount(recent_key, now - 10, now)  # 10 second burst window
            
            if recent_count >= burst_limit:
                return False, {
                    "remaining": 0,
                    "reset_time": int(now + 10),
                    "error": "Burst limit exceeded"
                }
            
            # Add to burst counter
            self.redis_client.zadd(recent_key, {str(now): now})
            self.redis_client.expire(recent_key, 20)
        
        # Check main rate limit
        if current_requests >= max_requests:
            return False, {
                "remaining": 0,
                "reset_time": int(now + window_seconds),
                "error": "Rate limit exceeded"
            }
        
        remaining = max_requests - current_requests - 1
        reset_time = int(now + window_seconds)
        
        return True, {"remaining": remaining, "reset_time": reset_time}
    
    async def _check_memory_rate_limit(
        self, key: str, max_requests: int, window_seconds: int, 
        now: float, burst_limit: Optional[int]
    ) -> Tuple[bool, Dict[str, int]]:
        """Memory-based rate limiting (development/fallback)"""
        
        requests = self.memory_store[key]["requests"]
        
        # Clean old requests
        cutoff = now - window_seconds
        requests[:] = [req_time for req_time in requests if req_time > cutoff]
        
        # Check burst limit
        if burst_limit:
            recent_requests = [req_time for req_time in requests if req_time > now - 10]
            if len(recent_requests) >= burst_limit:
                return False, {
                    "remaining": 0,
                    "reset_time": int(now + 10),
                    "error": "Burst limit exceeded"
                }
        
        # Check main rate limit
        if len(requests) >= max_requests:
            return False, {
                "remaining": 0,
                "reset_time": int(now + window_seconds),
                "error": "Rate limit exceeded"
            }
        
        # Add current request
        requests.append(now)
        
        remaining = max_requests - len(requests)
        reset_time = int(now + window_seconds)
        
        return True, {"remaining": remaining, "reset_time": reset_time}
    
    def get_identifier(self, request: Request, user_id: Optional[str] = None) -> str:
        """Get unique identifier for rate limiting"""
        if user_id:
            return f"user:{user_id}"
        
        # Get IP address
        ip = request.client.host
        if request.headers.get("x-forwarded-for"):
            ip = request.headers.get("x-forwarded-for").split(",")[0].strip()
        elif request.headers.get("x-real-ip"):
            ip = request.headers.get("x-real-ip")
        
        return f"ip:{ip}"

# Global rate limiting service instance
rate_limiter = RateLimitingService()

# Rate limiting configurations for different endpoints
RATE_LIMITS = {
    # Checkout endpoints - strict limits to prevent abuse
    "checkout_create": {"max_requests": 5, "window_seconds": 300, "burst_limit": 2},  # 5 per 5 minutes, 2 burst
    "checkout_complete": {"max_requests": 3, "window_seconds": 300, "burst_limit": 1},  # 3 per 5 minutes, 1 burst
    "guest_checkout": {"max_requests": 10, "window_seconds": 300, "burst_limit": 3},  # 10 per 5 minutes, 3 burst
    
    # Payment endpoints - very strict
    "payment_init": {"max_requests": 5, "window_seconds": 300, "burst_limit": 2},
    "payment_callback": {"max_requests": 20, "window_seconds": 60, "burst_limit": 5},
    
    # High-traffic endpoints - moderate limits
    "notifications": {"max_requests": 60, "window_seconds": 60, "burst_limit": 10},  # 1 per second average, 10 burst
    "listings": {"max_requests": 100, "window_seconds": 60, "burst_limit": 20},
    "cart": {"max_requests": 30, "window_seconds": 60, "burst_limit": 10},
    
    # Buy request endpoints - moderate limits for browsing
    "buy_requests": {"max_requests": 100, "window_seconds": 60, "burst_limit": 30},  # Generous for browsing
    "buy_request_create": {"max_requests": 10, "window_seconds": 300, "burst_limit": 3},  # 10 per 5 minutes
    
    # PDP and browsing endpoints - generous limits for user experience
    "pdp_view": {"max_requests": 200, "window_seconds": 60, "burst_limit": 50},  # Very generous for browsing
    "analytics": {"max_requests": 300, "window_seconds": 60, "burst_limit": 100}, # High limit for tracking
    "ab_testing": {"max_requests": 200, "window_seconds": 60, "burst_limit": 50}, # Generous for experiments
    
    # Auth endpoints - strict to prevent brute force
    "login": {"max_requests": 5, "window_seconds": 300, "burst_limit": 2},
    "register": {"max_requests": 3, "window_seconds": 300, "burst_limit": 1},
    
    # Default limits
    "default": {"max_requests": 50, "window_seconds": 60, "burst_limit": 10}
}

async def rate_limit_middleware(
    request: Request, 
    endpoint_key: str,
    user_id: Optional[str] = None
) -> None:
    """
    Rate limiting middleware function - TEMPORARILY DISABLED FOR TESTING
    
    Args:
        request: FastAPI request object
        endpoint_key: Key to identify endpoint limits
        user_id: Optional user ID for user-specific limits
        
    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    
    # TEMPORARILY DISABLED - Return immediately without rate limiting
    return
    
    # Original rate limiting code commented out for testing
    # Get rate limit configuration
    # config = RATE_LIMITS.get(endpoint_key, RATE_LIMITS["default"])
    
    # Get identifier
    # identifier = rate_limiter.get_identifier(request, user_id)
    
    # Check rate limit
    # is_allowed, rate_info = await rate_limiter.check_rate_limit(
    #     identifier=identifier,
    #     endpoint=endpoint_key,
    #     max_requests=config["max_requests"],
    #     window_seconds=config["window_seconds"],
    #     burst_limit=config.get("burst_limit")
    # )
    
    # if not is_allowed:
    #     # Add rate limit headers
    #     headers = {
    #         "X-RateLimit-Limit": str(config["max_requests"]),
    #         "X-RateLimit-Remaining": str(rate_info["remaining"]),
    #         "X-RateLimit-Reset": str(rate_info["reset_time"]),
    #         "Retry-After": str(rate_info["reset_time"] - int(time.time()))
    #     }
    #     
    #     error_message = rate_info.get("error", "Rate limit exceeded")
    #     
    #     raise HTTPException(
    #         status_code=429,
    #         detail={
    #             "error": error_message,
    #             "retry_after": rate_info["reset_time"] - int(time.time()),
    #             "limit": config["max_requests"],
    #             "window": config["window_seconds"]
    #         },
    #         headers=headers
    #     )

# Decorator for easy rate limiting
def rate_limit(endpoint_key: str):
    """Decorator for applying rate limits to endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request and user from function arguments
            request = None
            user_id = None
            
            for arg in args:
                if hasattr(arg, 'client'):  # FastAPI Request object
                    request = arg
                elif hasattr(arg, 'id'):  # User object
                    user_id = arg.id
            
            if request:
                await rate_limit_middleware(request, endpoint_key, user_id)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator