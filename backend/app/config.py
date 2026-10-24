import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")

    # Security
    SECRET_KEY: str = Field(
        default="trustvault-development-secret-key-32chars-min-change-in-prod-2026!"
    )
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Database: Supports SQLite (for tests / zero-setup dev) and PostgreSQL
    DATABASE_URL: str = Field(default="sqlite:///./trustvault.db")

    # Private Storage
    STORAGE_BACKEND: str = Field(default="local")
    LOCAL_STORAGE_PATH: str = Field(default="./private_storage")
    MAX_UPLOAD_SIZE_BYTES: int = Field(default=26214400)  # 25 MB

    # Audit Trail Integrity
    AUDIT_CHECKPOINT_KEY: str = Field(
        default="trustvault-audit-hmac-checkpoint-secret-key-32chars!!"
    )

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = Field(default=10)
    RATE_LIMIT_API_PER_MINUTE: int = Field(default=200)

    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
