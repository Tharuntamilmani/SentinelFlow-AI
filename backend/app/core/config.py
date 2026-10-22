"""SentinelFlow AI - Configuration Settings
Defines environment variables, model URLs, Bedrock configs, and audit settings.
"""

from __future__ import annotations

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "SentinelFlow AI — Autonomous Security Decision Agent"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # API Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: List[str] = ["*"]

    # Storage
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sentinelflow.db")

    # Strands Decider 2B Settings
    # Default port 8099 as established in official strands-decider documentation
    STRANDS_DECIDER_URL: str = os.getenv("STRANDS_DECIDER_URL", "http://127.0.0.1:8099")
    STRANDS_DECIDER_MODEL: str = os.getenv(
        "STRANDS_DECIDER_MODEL", "StrandsAgents/strands-decider-2B-qwen3.5-v1-2610"
    )
    # High-confidence threshold (decisions below this score are automatically routed to human review)
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.80"))
    # HTTP timeout for decider model calls in seconds
    DECIDER_TIMEOUT_SECONDS: float = float(os.getenv("DECIDER_TIMEOUT_SECONDS", "30.0"))

    # Amazon Bedrock Settings
    AWS_REGION: str = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
    BEDROCK_MODEL_ID: str = os.getenv(
        "BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"
    )
    BEDROCK_FALLBACK_MODEL_ID: str = os.getenv(
        "BEDROCK_FALLBACK_MODEL_ID", "amazon.nova-pro-v1:0"
    )


settings = Settings()
