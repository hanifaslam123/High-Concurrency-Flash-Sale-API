"""Application configuration — loaded from environment variables / .env file."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application
    APP_NAME: str = "High-Concurrency Flash Sale API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:password@localhost:5432/flash_sale_db"
    )

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_LOCK_EXPIRE: int = 5  # seconds

    # JWT
    SECRET_KEY: str = "change-me-in-production-super-secret-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]


settings = Settings()
