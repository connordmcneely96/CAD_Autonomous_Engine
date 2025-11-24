"""
CAD Engine API - FastAPI Application
=====================================

REST API for parametric CAD modeling using OpenCascade Technology.

Endpoints:
- POST /api/cad/primitives/box - Create box
- POST /api/cad/primitives/cylinder - Create cylinder
- POST /api/cad/primitives/sphere - Create sphere
- POST /api/cad/primitives/cone - Create cone
- POST /api/cad/operations/boolean - Boolean operations (union/subtract/intersect)
- POST /api/cad/operations/fillet - Apply fillet
- POST /api/cad/operations/chamfer - Apply chamfer
- POST /api/cad/operations/translate - Translate shape
- POST /api/cad/operations/rotate - Rotate shape
- POST /api/cad/operations/scale - Scale shape
- POST /api/cad/export - Export to STEP/STL
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uuid
import logging
from pathlib import Path
from typing import Dict

from app.core.kernel import CADKernel
from app.models.geometry import (
    CreateBoxRequest,
    CreateCylinderRequest,
    CreateSphereRequest,
    CreateConeRequest,
    BooleanRequest,
    FilletRequest,
    ChamferRequest,
    TranslateRequest,
    RotateRequest,
    ScaleRequest,
    ExportRequest,
    FeatureResponse,
    ExportResponse,
    HealthResponse,
    MeshData,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CAD Engine API",
    description="Parametric CAD modeling API powered by OpenCascade Technology",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - configure for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (TODO: Replace with Redis or database for production)
projects: Dict[str, Dict] = {}

# Temporary file storage
TEMP_DIR = Path("/tmp/cad-exports")
TEMP_DIR.mkdir(exist_ok=True)


@app.get("/", response_model=HealthResponse)
def read_root():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        opencascade_version="7.7.2"
    )


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Detailed health check"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        opencascade_version="7.7.2"
    )


# ===== PRIMITIVE CREATION ENDPOINTS =====

@app.post("/api/cad/primitives/box", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_box(request: CreateBoxRequest):
    """Create a rectangular box primitive"""
    try:
        logger.info(f"Creating box: {request.dict()}")
        
        kernel = CADKernel()
        shape = kernel.create_box(
            request.width,
            request.height,
            request.depth,
            request.center,
        )

        # Generate mesh for Three.js
        mesh_data = kernel.generate_mesh(shape)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": shape,
            "kernel": kernel,
            "type": "box",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except Exception as e:
        logger.error(f"Error creating box: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cad/primitives/cylinder", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_cylinder(request: CreateCylinderRequest):
    """Create a cylinder primitive"""
    try:
        logger.info(f"Creating cylinder: {request.dict()}")
        
        kernel = CADKernel()
        shape = kernel.create_cylinder(
            request.radius,
            request.height,
            request.center,
            request.axis,
        )

        mesh_data = kernel.generate_mesh(shape)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": shape,
            "kernel": kernel,
            "type": "cylinder",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except Exception as e:
        logger.error(f"Error creating cylinder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cad/primitives/sphere", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_sphere(request: CreateSphereRequest):
    """Create a sphere primitive"""
    try:
        logger.info(f"Creating sphere: {request.dict()}")
        
        kernel = CADKernel()
        shape = kernel.create_sphere(request.radius, request.center)

        mesh_data = kernel.generate_mesh(shape)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": shape,
            "kernel": kernel,
            "type": "sphere",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except Exception as e:
        logger.error(f"Error creating sphere: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cad/primitives/cone", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_cone(request: CreateConeRequest):
    """Create a cone or truncated cone primitive"""
    try:
        logger.info(f"Creating cone: {request.dict()}")
        
        kernel = CADKernel()
        shape = kernel.create_cone(
            request.radius1,
            request.radius2,
            request.height,
            request.center,
            request.axis,
        )

        mesh_data = kernel.generate_mesh(shape)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": shape,
            "kernel": kernel,
            "type": "cone",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except Exception as e:
        logger.error(f"Error creating cone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== BOOLEAN OPERATIONS =====

@app.post("/api/cad/operations/boolean", response_model=FeatureResponse)
def boolean_operation(request: BooleanRequest):
    """Perform boolean operation (union, subtract, or intersect)"""
    try:
        if request.feature_id1 not in projects or request.feature_id2 not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape1 = projects[request.feature_id1]["shape"]
        shape2 = projects[request.feature_id2]["shape"]

        kernel = CADKernel()

        if request.operation == "union":
            result = kernel.union(shape1, shape2)
        elif request.operation == "subtract":
            result = kernel.subtract(shape1, shape2)
        elif request.operation == "intersect":
            result = kernel.intersect(shape1, shape2)
        else:
            raise HTTPException(status_code=400, detail="Invalid operation. Use: union, subtract, or intersect")

        mesh_data = kernel.generate_mesh(result)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": result,
            "kernel": kernel,
            "type": "boolean",
            "operation": request.operation,
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in boolean operation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== FILLET AND CHAMFER =====

@app.post("/api/cad/operations/fillet", response_model=FeatureResponse)
def apply_fillet(request: FilletRequest):
    """Apply fillet to edges"""
    try:
        if request.feature_id not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape = projects[request.feature_id]["shape"]
        kernel = CADKernel()

        result = kernel.fillet_edges(shape, request.radius, request.edge_indices)
        mesh_data = kernel.generate_mesh(result)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": result,
            "kernel": kernel,
            "type": "fillet",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying fillet: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cad/operations/chamfer", response_model=FeatureResponse)
def apply_chamfer(request: ChamferRequest):
    """Apply chamfer to edges"""
    try:
        if request.feature_id not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape = projects[request.feature_id]["shape"]
        kernel = CADKernel()

        result = kernel.chamfer_edges(shape, request.distance, request.edge_indices)
        mesh_data = kernel.generate_mesh(result)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": result,
            "kernel": kernel,
            "type": "chamfer",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying chamfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== TRANSFORMATIONS =====

@app.post("/api/cad/operations/translate", response_model=FeatureResponse)
def translate_shape(request: TranslateRequest):
    """Translate (move) shape"""
    try:
        if request.feature_id not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape = projects[request.feature_id]["shape"]
        kernel = CADKernel()

        result = kernel.translate(shape, request.vector)
        mesh_data = kernel.generate_mesh(result)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": result,
            "kernel": kernel,
            "type": "translate",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cad/operations/rotate", response_model=FeatureResponse)
def rotate_shape(request: RotateRequest):
    """Rotate shape around axis"""
    try:
        if request.feature_id not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape = projects[request.feature_id]["shape"]
        kernel = CADKernel()

        result = kernel.rotate(shape, request.axis, request.angle, request.center)
        mesh_data = kernel.generate_mesh(result)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": result,
            "kernel": kernel,
            "type": "rotate",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rotating: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cad/operations/scale", response_model=FeatureResponse)
def scale_shape(request: ScaleRequest):
    """Scale shape uniformly"""
    try:
        if request.feature_id not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape = projects[request.feature_id]["shape"]
        kernel = CADKernel()

        result = kernel.scale(shape, request.factor, request.center)
        mesh_data = kernel.generate_mesh(result)

        feature_id = str(uuid.uuid4())
        projects[feature_id] = {
            "shape": result,
            "kernel": kernel,
            "type": "scale",
            "params": request.dict(),
        }

        return FeatureResponse(
            feature_id=feature_id,
            mesh=MeshData(**mesh_data),
            history=kernel.get_history(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scaling: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== EXPORT =====

@app.post("/api/cad/export", response_model=ExportResponse)
def export_geometry(request: ExportRequest):
    """Export geometry to STEP, STL, or IGES format"""
    try:
        if request.feature_id not in projects:
            raise HTTPException(status_code=404, detail="Feature not found")

        shape = projects[request.feature_id]["shape"]
        kernel = CADKernel()

        filename = f"{request.feature_id}.{request.format}"
        filepath = TEMP_DIR / filename

        if request.format == "step":
            kernel.export_step(shape, str(filepath))
        elif request.format == "stl":
            kernel.export_stl(shape, str(filepath))
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use: step or stl")

        # In production, upload to R2/S3 and return presigned URL
        # For now, return local path
        download_url = f"/api/cad/download/{filename}"

        return ExportResponse(
            download_url=download_url,
            format=request.format,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cad/download/{filename}")
def download_file(filename: str):
    """Download exported file"""
    filepath = TEMP_DIR / filename
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        filepath,
        media_type="application/octet-stream",
        filename=filename,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
