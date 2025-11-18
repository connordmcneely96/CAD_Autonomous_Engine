"""
API Routes for CAD AI Service.

This package contains FastAPI route handlers for processing natural language
CAD commands and knowledge base queries.
"""

from app.routes.ai_routes import router as ai_router

__all__ = ["ai_router"]
