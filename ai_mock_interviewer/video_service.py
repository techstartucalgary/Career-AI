"""
D-ID API integration for video generation
"""

import aiohttp
import asyncio
import time
from typing import Optional, Dict, Any
from .models import InterviewQuestion, CachedVideo
from .utils.logger import get_logger
from datetime import datetime, timedelta

logger = get_logger(__name__)


class DIDVideoService:
    """
    Service for generating interview question videos using D-ID API
    """

    BASE_URL = "https://api.d-id.com"

    def __init__(
        self,
        api_key: str,
        cache_manager: Optional[Any] = None,
        default_avatar: str = "amy",
        default_voice: str = "en-US-JennyNeural",
        max_retries: int = 3,
        timeout: int = 90
    ):
        """
        Initialize D-ID video service

        Args:
            api_key: D-ID API key
            cache_manager: Optional cache manager for video caching
            default_avatar: Default avatar identifier
            default_voice: Default voice identifier
            max_retries: Max retries for video generation
            timeout: Timeout in seconds for video generation
        """
        self.api_key = api_key
        self.cache_manager = cache_manager
        self.default_avatar = default_avatar
        self.default_voice = default_voice
        self.max_retries = max_retries
        self.timeout = timeout

        self.headers = {
            "Authorization": f"Basic {api_key}",
            "Content-Type": "application/json"
        }

    async def generate_video(
        self,
        question: InterviewQuestion,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None
    ) -> InterviewQuestion:
        """
        Generate video for a question

        Args:
            question: Interview question to generate video for
            avatar_id: Optional avatar override
            voice_id: Optional voice override

        Returns:
            Updated question with video URL

        Raises:
            RuntimeError: If video generation fails
        """
        avatar = avatar_id or self.default_avatar
        voice = voice_id or self.default_voice

        # Check cache first
        if self.cache_manager:
            cached = await self.cache_manager.get_cached_video(
                question.question_text,
                avatar,
                voice
            )
            if cached:
                logger.info(f"Using cached video for question {question.question_id}")
                question.video_url = cached.video_url
                question.video_duration = cached.video_duration
                question.did_video_id = cached.did_video_id
                return question

        # Generate new video
        logger.info(f"Generating video for question {question.question_id}")

        try:
            # Create talk
            talk_id = await self._create_talk(question.question_text, avatar, voice)

            # Poll for completion
            video_url, duration = await self._poll_talk_status(talk_id)

            # Update question
            question.video_url = video_url
            question.video_duration = duration
            question.did_video_id = talk_id

            # Cache the video
            if self.cache_manager:
                await self.cache_manager.cache_video(
                    question.question_text,
                    avatar,
                    voice,
                    video_url,
                    duration,
                    talk_id
                )

            logger.info(f"Successfully generated video for question {question.question_id}")
            return question

        except Exception as e:
            logger.error(f"Failed to generate video: {e}")
            raise RuntimeError(f"Video generation failed: {e}")

    async def _create_talk(
        self,
        text: str,
        avatar_id: str,
        voice_id: str
    ) -> str:
        """Create a D-ID talk and return talk ID"""

        # Map avatar_id to D-ID avatar URL
        avatar_url = self._get_avatar_url(avatar_id)

        payload = {
            "script": {
                "type": "text",
                "input": text,
                "provider": {
                    "type": "microsoft",
                    "voice_id": voice_id
                }
            },
            "source_url": avatar_url,
            "config": {
                "fluent": True,
                "pad_audio": 0.0,
                "stitch": True
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.BASE_URL}/talks",
                json=payload,
                headers=self.headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status != 201:
                    error_text = await response.text()
                    raise RuntimeError(f"D-ID API error: {error_text}")

                data = await response.json()
                return data["id"]

    async def _poll_talk_status(self, talk_id: str) -> tuple[str, float]:
        """
        Poll D-ID API until video is ready

        Returns:
            Tuple of (video_url, duration_seconds)
        """
        start_time = time.time()
        retry_count = 0

        async with aiohttp.ClientSession() as session:
            while time.time() - start_time < self.timeout:
                try:
                    async with session.get(
                        f"{self.BASE_URL}/talks/{talk_id}",
                        headers=self.headers,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:
                        if response.status != 200:
                            retry_count += 1
                            if retry_count >= self.max_retries:
                                raise RuntimeError("Max retries exceeded")
                            await asyncio.sleep(2)
                            continue

                        data = await response.json()
                        status = data.get("status")

                        if status == "done":
                            video_url = data.get("result_url")
                            duration = data.get("duration", 0)
                            return video_url, duration

                        elif status == "error":
                            error_msg = data.get("error", {}).get("description", "Unknown error")
                            raise RuntimeError(f"D-ID video generation error: {error_msg}")

                        # Status is "created" or "started", keep polling
                        await asyncio.sleep(2)

                except asyncio.TimeoutError:
                    logger.warning(f"Timeout polling talk {talk_id}, retrying...")
                    retry_count += 1
                    if retry_count >= self.max_retries:
                        raise RuntimeError("Max retries exceeded")
                    await asyncio.sleep(2)

        raise RuntimeError(f"Video generation timeout after {self.timeout}s")

    def _get_avatar_url(self, avatar_id: str) -> str:
        """Map avatar ID to D-ID avatar URL"""

        # Updated avatar URLs (using D-ID's stock images)
        avatars = {
            "amy": "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg",
            "john": "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/or-roman.jpg",
            "lisa": "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/rian.jpg",
            "mark": "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/or-roman.jpg",
            "sarah": "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg"
        }

        return avatars.get(avatar_id, avatars["amy"])

    async def generate_videos_batch(
        self,
        questions: list[InterviewQuestion],
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        max_concurrent: int = 3
    ) -> list[InterviewQuestion]:
        """
        Generate videos for multiple questions in parallel

        Args:
            questions: List of questions
            avatar_id: Optional avatar override
            voice_id: Optional voice override
            max_concurrent: Max concurrent video generations

        Returns:
            List of questions with videos
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def generate_with_semaphore(q):
            async with semaphore:
                return await self.generate_video(q, avatar_id, voice_id)

        tasks = [generate_with_semaphore(q) for q in questions]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        successful_questions = []
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Failed to generate video for question {idx}: {result}")
                # Keep question without video
                successful_questions.append(questions[idx])
            else:
                successful_questions.append(result)

        return successful_questions
