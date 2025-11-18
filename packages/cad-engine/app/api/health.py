"""Health check endpoints for CAD Engine Service."""

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


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="cad-engine",
        timestamp=datetime.utcnow().isoformat(),
        version="0.1.0",
    )


@router.get("/health/ready", response_model=ReadinessResponse)
async def readiness_check() -> ReadinessResponse:
    """Readiness check endpoint."""
    # Add checks for dependencies (database, storage, etc.)
    is_ready = True  # Placeholder

    return ReadinessResponse(
        status="ready" if is_ready else "not ready",
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/health/live", response_model=ReadinessResponse)
async def liveness_check() -> ReadinessResponse:
    """Liveness check endpoint."""
    return ReadinessResponse(
        status="alive",
        timestamp=datetime.utcnow().isoformat(),
    )
