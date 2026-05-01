"""
Redis client and distributed lock context manager.

The distributed lock prevents race conditions during high-concurrency
checkout operations (10,000+ simultaneous requests), ensuring inventory
is never oversold.
"""

import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import HTTPException, status

from app.core.config import settings

# ---------------------------------------------------------------------------
# Redis connection pool — shared singleton
# ---------------------------------------------------------------------------
_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Return the shared async Redis client (lazy-init with connection pool)."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=100,
        )
    return _redis_pool


# ---------------------------------------------------------------------------
# Distributed lock (Redlock-style for single node)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def redis_lock(
    key: str,
    expire: int = None,
    retry: int = 10,
    retry_delay: float = 0.1,
) -> AsyncGenerator[None, None]:
    """
    Async context manager for a distributed Redis lock.

    - Acquires a unique lock on *key* with a TTL of *expire* seconds.
    - Retries up to *retry* times with *retry_delay* seconds between attempts.
    - Raises HTTP 409 if the lock cannot be acquired (contention too high).
    - Always releases the lock on exit (even on exception), using the unique
      token to prevent accidental release of another holder's lock.

    Usage::

        async with redis_lock(f"inventory:{product_id}", expire=5):
            # critical section — safe to read/write inventory
            ...
    """
    expire = expire or settings.REDIS_LOCK_EXPIRE
    lock_token = str(uuid.uuid4())
    redis = await get_redis()

    # Acquire
    acquired = False
    for _ in range(retry):
        ok = await redis.set(key, lock_token, nx=True, ex=expire)
        if ok:
            acquired = True
            break
        await asyncio.sleep(retry_delay)

    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Service busy — could not acquire lock. Please retry.",
        )

    try:
        yield
    finally:
        # Release only if we still own the lock (atomic Lua script)
        lua_script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
        """
        await redis.eval(lua_script, 1, key, lock_token)
