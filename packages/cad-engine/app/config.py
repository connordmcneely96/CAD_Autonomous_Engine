"""Configuration management for CAD Engine Service."""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""

    # Server
    environment: str = Field(default="development", alias="ENVIRONMENT")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        alias="CORS_ORIGINS",
    )

    # Processing
    max_file_size_mb: int = Field(default=100, alias="MAX_FILE_SIZE_MB")
    processing_timeout_seconds: int = Field(default=300, alias="PROCESSING_TIMEOUT_SECONDS")

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False
        extra = "allow"


settings = Settings()
