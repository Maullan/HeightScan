"""Application configuration using Pydantic BaseSettings."""

from __future__ import annotations

import json
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Height Measurement System"
    app_version: str = "1.0.0"
    debug: bool = False

    # Security
    api_key: str = "dev-secret-api-key"

    # CORS – stored as JSON string in env, parsed below
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v  # type: ignore[return-value]

    # ESP32
    esp32_url: str = "http://192.168.1.100"
    esp32_trigger_timeout: float = 10.0

    # Session
    session_ttl_seconds: int = 300  # 5 minutes

    # Sensor validation
    min_height_cm: float = 50.0
    max_height_cm: float = 250.0
    reference_height_cm: float = 250.0

    # Rate limiting
    rate_limit_per_minute: int = 100

    # Supabase — for verifying user tokens via Auth server
    # JWT secret is no longer needed — we verify via the Auth API instead
    supabase_url: str = ""
    supabase_anon_key: str = ""  # anon/publishable key, used as apikey header


# Singleton instance — loaded fresh on every uvicorn reload
settings = Settings()
