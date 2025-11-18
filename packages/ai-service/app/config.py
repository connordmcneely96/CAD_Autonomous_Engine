"""Configuration management for AI Service."""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""

    # Server
    environment: str = Field(default="development", alias="ENVIRONMENT")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8001, alias="PORT")

    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        alias="CORS_ORIGINS",
    )

    # Anthropic
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")

    # OpenAI
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")

    # Pinecone
    pinecone_api_key: str = Field(default="", alias="PINECONE_API_KEY")
    pinecone_environment: str = Field(default="", alias="PINECONE_ENVIRONMENT")
    pinecone_index_name: str = Field(default="cad-embeddings", alias="PINECONE_INDEX_NAME")

    # Model Configuration
    default_llm_model: str = Field(
        default="claude-3-sonnet-20240229",
        alias="DEFAULT_LLM_MODEL",
    )
    default_embedding_model: str = Field(
        default="text-embedding-ada-002",
        alias="DEFAULT_EMBEDDING_MODEL",
    )

    # Processing
    max_tokens: int = Field(default=4096, alias="MAX_TOKENS")
    temperature: float = Field(default=0.7, alias="TEMPERATURE")

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False
        extra = "allow"


settings = Settings()
