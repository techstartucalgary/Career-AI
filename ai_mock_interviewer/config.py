"""
Configuration management for AI Mock Interviewer
"""

import os
from typing import Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class DIDConfig(BaseModel):
    """D-ID API configuration"""
    api_key: str = Field(default_factory=lambda: os.getenv("DID_API_KEY", ""))
    base_url: str = "https://api.d-id.com"
    default_avatar: str = "amy"
    default_voice: str = "en-US-JennyNeural"
    timeout: int = 90
    max_retries: int = 3
    max_concurrent: int = 3


class GeminiConfig(BaseModel):
    """Gemini AI configuration"""
    api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    model_name: str = "gemini-2.5-flash"
    question_generation_temperature: float = 0.7
    evaluation_temperature: float = 0.4
    max_output_tokens: int = 8192


class CacheConfig(BaseModel):
    """Video caching configuration"""
    enabled: bool = True
    ttl_days: int = 30
    max_cache_size_mb: int = 1000
    cleanup_interval_hours: int = 24


class InterviewDefaultConfig(BaseModel):
    """Interview generation configuration"""
    default_num_questions: int = 8
    min_questions: int = 3
    max_questions: int = 15
    default_difficulty: str = "mid"
    default_interview_type: str = "mixed"
    enable_resume_specific: bool = True


class StorageConfig(BaseModel):
    """Storage configuration"""
    storage_type: str = "sqlite"
    sqlite_path: str = "./data/interviews.db"
    json_path: str = "./data/interviews/"
    auto_backup: bool = True
    backup_interval_hours: int = 24


class SystemConfig(BaseModel):
    """Overall system configuration"""
    did: DIDConfig = Field(default_factory=DIDConfig)
    gemini: GeminiConfig = Field(default_factory=GeminiConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)
    interview: InterviewDefaultConfig = Field(default_factory=InterviewDefaultConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    log_level: str = "INFO"
    log_file: Optional[str] = "./logs/mock_interviewer.log"


# Global config instance
_config: Optional[SystemConfig] = None


def get_config() -> SystemConfig:
    """Get the global configuration instance"""
    global _config
    if _config is None:
        _config = SystemConfig()
    return _config


def load_config_from_file(config_path: str) -> SystemConfig:
    """Load configuration from YAML file"""
    import yaml

    with open(config_path, 'r') as f:
        config_dict = yaml.safe_load(f)

    global _config
    _config = SystemConfig(**config_dict)
    return _config
