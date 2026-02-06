"""
Video caching management
"""

from typing import Optional
from datetime import datetime, timedelta
from .models import CachedVideo
from .storage.sqlite_storage import SQLiteStorage
from .utils.helpers import generate_cache_key
from .utils.logger import get_logger

logger = get_logger(__name__)


class CacheManager:
    """
    Manages video caching to reduce D-ID API costs
    """

    def __init__(self, storage: SQLiteStorage, cache_config):
        """
        Initialize cache manager

        Args:
            storage: Storage backend
            cache_config: Cache configuration
        """
        self.storage = storage
        self.cache_config = cache_config
        self.enabled = cache_config.enabled
        self.ttl_days = cache_config.ttl_days

    async def get_cached_video(
        self,
        question_text: str,
        avatar_id: str,
        voice_id: str
    ) -> Optional[CachedVideo]:
        """
        Get cached video if it exists

        Args:
            question_text: Question text
            avatar_id: Avatar identifier
            voice_id: Voice identifier

        Returns:
            CachedVideo if found, None otherwise
        """
        if not self.enabled:
            return None

        cache_key = generate_cache_key(question_text, avatar_id, voice_id)
        cached = self.storage.load_cached_video(cache_key)

        if cached:
            logger.info(f"Cache hit for key: {cache_key}")
            return cached

        logger.info(f"Cache miss for key: {cache_key}")
        return None

    async def cache_video(
        self,
        question_text: str,
        avatar_id: str,
        voice_id: str,
        video_url: str,
        video_duration: float,
        did_video_id: str
    ):
        """
        Cache a generated video

        Args:
            question_text: Question text
            avatar_id: Avatar identifier
            voice_id: Voice identifier
            video_url: Generated video URL
            video_duration: Video duration in seconds
            did_video_id: D-ID video identifier
        """
        if not self.enabled:
            return

        cache_key = generate_cache_key(question_text, avatar_id, voice_id)
        expires_at = datetime.utcnow() + timedelta(days=self.ttl_days)

        cached_video = CachedVideo(
            cache_key=cache_key,
            question_text=question_text,
            avatar_id=avatar_id,
            voice_id=voice_id,
            video_url=video_url,
            video_duration=video_duration,
            did_video_id=did_video_id,
            expires_at=expires_at
        )

        self.storage.save_cached_video(cached_video)
        logger.info(f"Cached video with key: {cache_key}")

    def cleanup_expired(self):
        """Remove expired cached videos"""
        if not self.enabled:
            return

        self.storage.cleanup_expired_cache()
