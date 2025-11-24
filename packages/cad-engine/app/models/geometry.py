"""
Pydantic models for CAD geometry API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List, Tuple, Optional, Dict, Any


class CreateBoxRequest(BaseModel):
    width: float = Field(..., gt=0, description="Box width (X dimension)")
    height: float = Field(..., gt=0, description="Box height (Y dimension)")
    depth: float = Field(..., gt=0, description="Box depth (Z dimension)")
    center: Tuple[float, float, float] = Field(default=(0, 0, 0), description="Center point")


class CreateCylinderRequest(BaseModel):
    radius: float = Field(..., gt=0, description="Cylinder radius")
    height: float = Field(..., gt=0, description="Cylinder height")
    center: Tuple[float, float, float] = Field(default=(0, 0, 0), description="Base center point")
    axis: Tuple[float, float, float] = Field(default=(0, 0, 1), description="Cylinder axis direction")


class CreateSphereRequest(BaseModel):
    radius: float = Field(..., gt=0, description="Sphere radius")
    center: Tuple[float, float, float] = Field(default=(0, 0, 0), description="Center point")


class CreateConeRequest(BaseModel):
    radius1: float = Field(..., gt=0, description="Bottom radius")
    radius2: float = Field(..., ge=0, description="Top radius")
    height: float = Field(..., gt=0, description="Cone height")
    center: Tuple[float, float, float] = Field(default=(0, 0, 0), description="Base center point")
    axis: Tuple[float, float, float] = Field(default=(0, 0, 1), description="Cone axis direction")


class BooleanRequest(BaseModel):
    operation: str = Field(..., description="Operation type: 'union', 'subtract', or 'intersect'")
    feature_id1: str = Field(..., description="First feature ID")
    feature_id2: str = Field(..., description="Second feature ID")


class FilletRequest(BaseModel):
    feature_id: str = Field(..., description="Feature ID to apply fillet to")
    radius: float = Field(..., gt=0, description="Fillet radius")
    edge_indices: Optional[List[int]] = Field(default=None, description="Specific edge indices (None = all edges)")


class ChamferRequest(BaseModel):
    feature_id: str = Field(..., description="Feature ID to apply chamfer to")
    distance: float = Field(..., gt=0, description="Chamfer distance")
    edge_indices: Optional[List[int]] = Field(default=None, description="Specific edge indices (None = all edges)")


class TranslateRequest(BaseModel):
    feature_id: str = Field(..., description="Feature ID to translate")
    vector: Tuple[float, float, float] = Field(..., description="Translation vector (dx, dy, dz)")


class RotateRequest(BaseModel):
    feature_id: str = Field(..., description="Feature ID to rotate")
    axis: Tuple[float, float, float] = Field(..., description="Rotation axis direction")
    angle: float = Field(..., description="Rotation angle in degrees")
    center: Tuple[float, float, float] = Field(default=(0, 0, 0), description="Rotation center point")


class ScaleRequest(BaseModel):
    feature_id: str = Field(..., description="Feature ID to scale")
    factor: float = Field(..., gt=0, description="Scale factor")
    center: Tuple[float, float, float] = Field(default=(0, 0, 0), description="Scale center point")


class ExportRequest(BaseModel):
    feature_id: str = Field(..., description="Feature ID to export")
    format: str = Field(..., description="Export format: 'step', 'stl', or 'iges'")


class MeshData(BaseModel):
    vertices: List[float] = Field(..., description="Flat array of vertex coordinates [x1,y1,z1,x2,y2,z2,...]")
    normals: List[float] = Field(..., description="Flat array of normal vectors")
    indices: List[int] = Field(..., description="Triangle indices")


class FeatureResponse(BaseModel):
    feature_id: str = Field(..., description="Unique feature identifier")
    mesh: MeshData = Field(..., description="Mesh data for Three.js visualization")
    history: List[Dict[str, Any]] = Field(..., description="Feature history for parametric editing")
    success: bool = Field(default=True, description="Operation success status")


class ExportResponse(BaseModel):
    download_url: str = Field(..., description="URL to download exported file")
    format: str = Field(..., description="Export format")
    success: bool = Field(default=True, description="Operation success status")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    opencascade_version: str = Field(..., description="OpenCascade version")
