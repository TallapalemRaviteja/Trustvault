import time
import threading
from typing import Dict, List
from fastapi import HTTPException, status, Request
from app.config import settings


class InMemoryRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._records: Dict[str, List[float]] = {}

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        with self._lock:
            timestamps = self._records.get(key, [])
            # Filter timestamps inside window
            timestamps = [ts for ts in timestamps if now - ts < window_seconds]
            if len(timestamps) >= max_requests:
                self._records[key] = timestamps
                return False
            timestamps.append(now)
            self._records[key] = timestamps
            return True

    def reset(self):
        with self._lock:
            self._records.clear()


limiter = InMemoryRateLimiter()


def check_rate_limit(request: Request, key_prefix: str = "general", max_requests: int = None, window_seconds: int = 60):
    """Enforces rate limiting based on client IP."""
    if max_requests is None:
        max_requests = settings.RATE_LIMIT_API_PER_MINUTE
    
    # Extract client IP
    client_ip = request.client.host if request.client else "unknown"
    key = f"{key_prefix}:{client_ip}"
    
    if not limiter.is_allowed(key, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before making more requests.",
            headers={"Retry-After": str(window_seconds)},
        )
