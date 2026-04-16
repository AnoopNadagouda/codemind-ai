import json
import os
from typing import Any, Dict, Optional

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None


class CollabManager:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client = None
        self.enabled = False

    async def connect(self) -> bool:
        if redis is None:
            self.enabled = False
            return False

        try:
            self._client = redis.from_url(self.redis_url, decode_responses=True)
            await self._client.ping()
            self.enabled = True
            return True
        except Exception:
            self._client = None
            self.enabled = False
            return False

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()

    async def broadcast_change(self, room_id: str, change: Dict[str, Any]) -> None:
        if not self.enabled or self._client is None:
            return

        await self._client.publish(f"room:{room_id}", json.dumps(change))

    async def store_room_state(self, room_id: str, code: str, ttl_seconds: int = 3600) -> None:
        if not self.enabled or self._client is None:
            return

        await self._client.setex(f"state:{room_id}", ttl_seconds, code)

    async def load_room_state(self, room_id: str) -> str:
        if not self.enabled or self._client is None:
            return ""

        value = await self._client.get(f"state:{room_id}")
        return value or ""
