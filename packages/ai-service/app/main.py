"""Main FastAPI application for AI Service."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.health import router as health_router
from app.routes.ai_routes import router as ai_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager."""
    logger.info("Starting AI Service...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Running on {settings.host}:{settings.port}")

    # Initialize AI clients
    if settings.anthropic_api_key:
        logger.info("Anthropic API key configured")
    if settings.openai_api_key:
        logger.info("OpenAI API key configured")
    if settings.pinecone_api_key:
        logger.info("Pinecone API key configured")

    yield
    logger.info("Shutting down AI Service...")


# Create FastAPI app
app = FastAPI(
    title="AI Service",
    description="Natural language interface for CAD operations",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router, tags=["health"])
app.include_router(ai_router)


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "CAD Autonomous Engine - AI Service",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "ai_command": "/ai/command",
            "ai_examples": "/ai/examples",
            "ai_status": "/ai/status",
            "knowledge_search": "/ai/knowledge/search",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )
