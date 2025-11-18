"""
Primitive CAD Operations

This module provides functions to create basic 3D geometric primitives
like boxes, cylinders, and spheres.

Currently using MOCK implementation. To enable real OpenCascade:
1. Install pythonOCC-core: conda install -c conda-forge pythonocc-core
2. Set USE_MOCK_CAD=false in environment
3. Restart the service
"""

import logging
import os
import uuid
from typing import Dict, Any, Optional
from app.geometry.mesh_generator import generate_mesh

logger = logging.getLogger(__name__)

USE_MOCK_CAD = os.getenv("USE_MOCK_CAD", "true").lower() == "true"

if not USE_MOCK_CAD:
    try:
        from OCC.Core.BRepPrimAPI import (
            BRepPrimAPI_MakeBox,
            BRepPrimAPI_MakeCylinder,
            BRepPrimAPI_MakeSphere
        )
        from OCC.Core.gp import gp_Pnt, gp_Ax2, gp_Dir
        OCC_AVAILABLE = True
        logger.info("OpenCascade primitives loaded successfully")
    except ImportError:
        OCC_AVAILABLE = False
        USE_MOCK_CAD = True
        logger.warning("OpenCascade not available, using mock primitives")
else:
    OCC_AVAILABLE = False


def create_box(
    width: float,
    height: float,
    depth: float,
    position: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Create a box (rectangular prism) with specified dimensions.

    Args:
        width: Width of the box (X dimension) in mm
        height: Height of the box (Y dimension) in mm
        depth: Depth of the box (Z dimension) in mm
        position: Optional position dict with x, y, z coordinates

    Returns:
        Dictionary containing:
        - feature_id: Unique identifier for this feature
        - type: "box"
        - parameters: Input parameters
        - geometry: Mesh data (vertices, indices, normals)

    Example:
        >>> box = create_box(50, 50, 50)
        >>> print(box["geometry"]["vertex_count"])
        24
    """
    if position is None:
        position = {"x": 0, "y": 0, "z": 0}

    feature_id = f"box-{uuid.uuid4().hex[:8]}"

    if USE_MOCK_CAD:
        # Mock implementation
        mesh_data = generate_mesh(
            geometry_type="box",
            parameters={"width": width, "height": height, "depth": depth}
        )
    else:
        # Real OpenCascade implementation
        if not OCC_AVAILABLE:
            raise RuntimeError("OpenCascade not available. Set USE_MOCK_CAD=true.")

        # Create box centered at origin
        corner = gp_Pnt(-width / 2, -height / 2, -depth / 2)
        box = BRepPrimAPI_MakeBox(corner, width, height, depth).Shape()

        # Generate mesh from OCC shape
        mesh_data = generate_mesh(box)

    return {
        "feature_id": feature_id,
        "type": "box",
        "parameters": {
            "width": width,
            "height": height,
            "depth": depth,
            "position": position,
        },
        "geometry": mesh_data,
    }


def create_cylinder(
    radius: float,
    height: float,
    position: Optional[Dict[str, float]] = None,
    segments: int = 32
) -> Dict[str, Any]:
    """
    Create a cylinder with specified dimensions.

    Args:
        radius: Radius of the cylinder in mm
        height: Height of the cylinder in mm
        position: Optional position dict with x, y, z coordinates
        segments: Number of segments for circular approximation (mock only)

    Returns:
        Dictionary containing:
        - feature_id: Unique identifier
        - type: "cylinder"
        - parameters: Input parameters
        - geometry: Mesh data

    Example:
        >>> cylinder = create_cylinder(10, 20)
        >>> print(cylinder["parameters"]["radius"])
        10
    """
    if position is None:
        position = {"x": 0, "y": 0, "z": 0}

    feature_id = f"cylinder-{uuid.uuid4().hex[:8]}"

    if USE_MOCK_CAD:
        # Mock implementation
        mesh_data = generate_mesh(
            geometry_type="cylinder",
            parameters={"radius": radius, "height": height, "segments": segments}
        )
    else:
        # Real OpenCascade implementation
        if not OCC_AVAILABLE:
            raise RuntimeError("OpenCascade not available. Set USE_MOCK_CAD=true.")

        # Create cylinder centered at origin, along Y axis
        axis = gp_Ax2(gp_Pnt(0, -height / 2, 0), gp_Dir(0, 1, 0))
        cylinder = BRepPrimAPI_MakeCylinder(axis, radius, height).Shape()

        # Generate mesh from OCC shape
        mesh_data = generate_mesh(cylinder)

    return {
        "feature_id": feature_id,
        "type": "cylinder",
        "parameters": {
            "radius": radius,
            "height": height,
            "position": position,
            "segments": segments,
        },
        "geometry": mesh_data,
    }


def create_sphere(
    radius: float,
    position: Optional[Dict[str, float]] = None,
    segments: int = 32
) -> Dict[str, Any]:
    """
    Create a sphere with specified radius.

    Args:
        radius: Radius of the sphere in mm
        position: Optional position dict with x, y, z coordinates
        segments: Number of segments for approximation (mock only)

    Returns:
        Dictionary containing:
        - feature_id: Unique identifier
        - type: "sphere"
        - parameters: Input parameters
        - geometry: Mesh data

    Example:
        >>> sphere = create_sphere(15)
        >>> print(sphere["type"])
        "sphere"
    """
    if position is None:
        position = {"x": 0, "y": 0, "z": 0}

    feature_id = f"sphere-{uuid.uuid4().hex[:8]}"

    if USE_MOCK_CAD:
        # Mock implementation
        mesh_data = generate_mesh(
            geometry_type="sphere",
            parameters={"radius": radius, "segments": segments}
        )
    else:
        # Real OpenCascade implementation
        if not OCC_AVAILABLE:
            raise RuntimeError("OpenCascade not available. Set USE_MOCK_CAD=true.")

        # Create sphere centered at origin
        sphere = BRepPrimAPI_MakeSphere(radius).Shape()

        # Generate mesh from OCC shape
        mesh_data = generate_mesh(sphere)

    return {
        "feature_id": feature_id,
        "type": "sphere",
        "parameters": {
            "radius": radius,
            "position": position,
            "segments": segments,
        },
        "geometry": mesh_data,
    }


def create_cone(
    radius1: float,
    radius2: float,
    height: float,
    position: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Create a cone with specified radii and height.

    Args:
        radius1: Bottom radius in mm
        radius2: Top radius in mm (0 for pure cone)
        height: Height in mm
        position: Optional position dict

    Returns:
        Dictionary with feature data and geometry
    """
    if position is None:
        position = {"x": 0, "y": 0, "z": 0}

    feature_id = f"cone-{uuid.uuid4().hex[:8]}"

    # For mock, use cylinder as approximation
    mesh_data = generate_mesh(
        geometry_type="cylinder",
        parameters={"radius": (radius1 + radius2) / 2, "height": height}
    )

    return {
        "feature_id": feature_id,
        "type": "cone",
        "parameters": {
            "radius1": radius1,
            "radius2": radius2,
            "height": height,
            "position": position,
        },
        "geometry": mesh_data,
    }
