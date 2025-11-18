"""Health check endpoints for AI Service."""

from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str
    service: str
    timestamp: str
    version: str


class ReadinessResponse(BaseModel):
    """Readiness check response model."""

    status: str
    timestamp: str
    checks: dict


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="ai-service",
        timestamp=datetime.utcnow().isoformat(),
        version="0.1.0",
    )


@router.get("/health/ready", response_model=ReadinessResponse)
async def readiness_check() -> ReadinessResponse:
    """Readiness check endpoint."""
    # Add checks for AI services (API keys, vector DB, etc.)
    checks = {
        "anthropic": True,  # Placeholder
        "openai": True,  # Placeholder
        "pinecone": True,  # Placeholder
    }

    is_ready = all(checks.values())

    return ReadinessResponse(
        status="ready" if is_ready else "not ready",
        timestamp=datetime.utcnow().isoformat(),
        checks=checks,
    )


@router.get("/health/live")
async def liveness_check() -> dict:
    """Liveness check endpoint."""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
    }
