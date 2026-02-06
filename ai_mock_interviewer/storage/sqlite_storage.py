"""
SQLite storage implementation
"""

import sqlite3
import json
from typing import List, Optional
from datetime import datetime
from pathlib import Path
from ..models import InterviewSession, CachedVideo
from ..utils.logger import get_logger

logger = get_logger(__name__)


class SQLiteStorage:
    """SQLite storage backend for interview sessions"""

    def __init__(self, db_path: str = "./data/interviews.db"):
        """Initialize SQLite storage"""
        self.db_path = db_path

        # Create directory if needed
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        # Initialize database
        self._init_database()

    def _init_database(self):
        """Create tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Interview sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                session_id TEXT PRIMARY KEY,
                session_data TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        """)

        # Cached videos table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cached_videos (
                cache_key TEXT PRIMARY KEY,
                video_data TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                last_accessed TIMESTAMP NOT NULL,
                access_count INTEGER DEFAULT 0,
                expires_at TIMESTAMP NOT NULL
            )
        """)

        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_session_status
            ON interview_sessions(status)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_session_created
            ON interview_sessions(created_at DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_cache_expires
            ON cached_videos(expires_at)
        """)

        conn.commit()
        conn.close()

        logger.info(f"Initialized SQLite database at {self.db_path}")

    def save_session(self, session: InterviewSession):
        """Save or update interview session"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        session_json = session.model_dump_json()
        now = datetime.utcnow()

        cursor.execute("""
            INSERT OR REPLACE INTO interview_sessions
            (session_id, session_data, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            session.session_id,
            session_json,
            session.status.value,
            session.created_at,
            now
        ))

        conn.commit()
        conn.close()

    def load_session(self, session_id: str) -> Optional[InterviewSession]:
        """Load interview session by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT session_data FROM interview_sessions
            WHERE session_id = ?
        """, (session_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return InterviewSession.model_validate_json(row[0])

    def list_sessions(self, limit: int = 50) -> List[InterviewSession]:
        """List all sessions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT session_data FROM interview_sessions
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        return [InterviewSession.model_validate_json(row[0]) for row in rows]

    def save_cached_video(self, video: CachedVideo):
        """Save cached video"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        video_json = video.model_dump_json()

        cursor.execute("""
            INSERT OR REPLACE INTO cached_videos
            (cache_key, video_data, created_at, last_accessed, access_count, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            video.cache_key,
            video_json,
            video.created_at,
            video.last_accessed,
            video.access_count,
            video.expires_at
        ))

        conn.commit()
        conn.close()

    def load_cached_video(self, cache_key: str) -> Optional[CachedVideo]:
        """Load cached video by key"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT video_data FROM cached_videos
            WHERE cache_key = ? AND expires_at > ?
        """, (cache_key, datetime.utcnow()))

        row = cursor.fetchone()

        if row:
            # Update access count and timestamp
            cursor.execute("""
                UPDATE cached_videos
                SET last_accessed = ?, access_count = access_count + 1
                WHERE cache_key = ?
            """, (datetime.utcnow(), cache_key))
            conn.commit()

        conn.close()

        if not row:
            return None

        return CachedVideo.model_validate_json(row[0])

    def cleanup_expired_cache(self):
        """Remove expired cached videos"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM cached_videos
            WHERE expires_at < ?
        """, (datetime.utcnow(),))

        deleted = cursor.rowcount
        conn.commit()
        conn.close()

        logger.info(f"Cleaned up {deleted} expired cached videos")
