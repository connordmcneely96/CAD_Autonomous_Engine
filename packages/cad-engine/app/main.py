"""Main FastAPI application for CAD Engine Service."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator, Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.api.health import router as health_router
from app.operations.primitives import create_box, create_cylinder, create_sphere, create_cone
from app.operations.features import extrude, cut, fillet, chamfer, shell
from app.export.formats import export_step, export_stl, export_obj
from app.geometry.mesh_generator import get_mesh_info

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager."""
    logger.info("Starting CAD Engine Service...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Running on {settings.host}:{settings.port}")
    yield
    logger.info("Shutting down CAD Engine Service...")


# Create FastAPI app
app = FastAPI(
    title="CAD Engine Service",
    description="AI-powered CAD processing engine",
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


# ============================================================================
# Pydantic Models for Request/Response
# ============================================================================

class Position(BaseModel):
    """3D position coordinates."""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class BoxRequest(BaseModel):
    """Request to create a box."""
    width: float = Field(..., gt=0, description="Width in mm")
    height: float = Field(..., gt=0, description="Height in mm")
    depth: float = Field(..., gt=0, description="Depth in mm")
    position: Optional[Position] = None


class CylinderRequest(BaseModel):
    """Request to create a cylinder."""
    radius: float = Field(..., gt=0, description="Radius in mm")
    height: float = Field(..., gt=0, description="Height in mm")
    position: Optional[Position] = None
    segments: int = Field(32, ge=8, le=128)


class SphereRequest(BaseModel):
    """Request to create a sphere."""
    radius: float = Field(..., gt=0, description="Radius in mm")
    position: Optional[Position] = None
    segments: int = Field(32, ge=8, le=128)


class ExtrudeRequest(BaseModel):
    """Request to extrude a sketch."""
    sketch_data: Dict[str, Any]
    distance: float = Field(..., gt=0)
    direction: str = "normal"


class FilletRequest(BaseModel):
    """Request to fillet edges."""
    geometry: Dict[str, Any]
    edges: List[int]
    radius: float = Field(..., gt=0)


class ExportRequest(BaseModel):
    """Request to export geometry."""
    geometry: Dict[str, Any]
    format: str = Field(..., pattern="^(step|stl|obj)$")
    filename: Optional[str] = None
    ascii_mode: bool = False  # For STL


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "CAD Autonomous Engine - CAD Processing Service",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "primitives": "/cad/primitives/*",
            "operations": "/cad/operations/*",
            "export": "/cad/export/*",
            "info": "/cad/info",
        },
    }


@app.get("/cad/info", tags=["info"])
async def get_cad_info():
    """Get CAD engine information."""
    info = get_mesh_info()
    return {
        "success": True,
        "data": {
            **info,
            "supported_primitives": ["box", "cylinder", "sphere", "cone"],
            "supported_operations": ["extrude", "cut", "fillet", "chamfer", "shell"],
            "supported_exports": ["step", "stl", "obj"],
        },
    }


# ============================================================================
# Primitive Operations
# ============================================================================

@app.post("/cad/primitives/box", tags=["primitives"], status_code=status.HTTP_201_CREATED)
async def create_box_endpoint(request: BoxRequest):
    """Create a box primitive."""
    try:
        position_dict = request.position.model_dump() if request.position else None
        result = create_box(request.width, request.height, request.depth, position_dict)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error creating box: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cad/primitives/cylinder", tags=["primitives"], status_code=status.HTTP_201_CREATED)
async def create_cylinder_endpoint(request: CylinderRequest):
    """Create a cylinder primitive."""
    try:
        position_dict = request.position.model_dump() if request.position else None
        result = create_cylinder(
            request.radius,
            request.height,
            position_dict,
            request.segments
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error creating cylinder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cad/primitives/sphere", tags=["primitives"], status_code=status.HTTP_201_CREATED)
async def create_sphere_endpoint(request: SphereRequest):
    """Create a sphere primitive."""
    try:
        position_dict = request.position.model_dump() if request.position else None
        result = create_sphere(request.radius, position_dict, request.segments)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error creating sphere: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Feature Operations
# ============================================================================

@app.post("/cad/operations/extrude", tags=["operations"], status_code=status.HTTP_201_CREATED)
async def extrude_endpoint(request: ExtrudeRequest):
    """Extrude a 2D sketch into 3D solid."""
    try:
        result = extrude(request.sketch_data, request.distance, request.direction)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error extruding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cad/operations/fillet", tags=["operations"], status_code=status.HTTP_201_CREATED)
async def fillet_endpoint(request: FilletRequest):
    """Add fillet to edges."""
    try:
        result = fillet(request.geometry, request.edges, request.radius)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error creating fillet: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Export Operations
# ============================================================================

@app.post("/cad/export", tags=["export"])
async def export_geometry(request: ExportRequest):
    """Export geometry to specified format."""
    try:
        if request.format == "step":
            result = export_step(request.geometry, request.filename)
        elif request.format == "stl":
            result = export_stl(request.geometry, request.filename, request.ascii_mode)
        elif request.format == "obj":
            result = export_obj(request.geometry, request.filename)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")

        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error exporting: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cad/export/download/{filename}", tags=["export"])
async def download_export(filename: str):
    """Download exported file."""
    import tempfile
    import os

    file_path = os.path.join(tempfile.gettempdir(), filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=filename
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )
