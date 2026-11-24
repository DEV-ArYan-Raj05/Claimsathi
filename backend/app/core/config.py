"""Settings from environment variables only (rules.md §2.3, §10). Names listed in .env.example."""

from functools import cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["development", "test", "production"] = "development"
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = ""
    redis_url: str = ""
    twilio_auth_token: str = ""
    supabase_send_sms_hook_secret: str = ""
    cors_origins: str = ""
    # Sarvam AI (PRD §3.6). The key stays server-side; SecretStr keeps it out of reprs and logs.
    sarvam_api_key: SecretStr = SecretStr("")
    sarvam_chat_model: str = "sarvam-105b"
    sarvam_translate_model: str = "sarvam-translate:v1"
    sarvam_timeout_seconds: float = 25.0
    sarvam_max_retries: int = 1
    chat_messages_per_minute: int = 12
    # Whole chat turn (detect + translate + chat + translate). Below the Vercel function maxDuration (90 s).
    chat_request_timeout_seconds: float = 75.0

    @property
    def is_production(self) -> bool:
        """True when admin/mock routes must stay unmounted."""
        return self.env == "production"


@cache
def get_settings() -> Settings:
    """Process-wide settings instance."""
    return Settings()
