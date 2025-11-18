"""
Mesh Generator for CAD Geometry

This module converts OpenCascade B-rep solids into triangle meshes
suitable for visualization in Three.js.

Currently using MOCK implementation. To enable real OpenCascade:
1. Install pythonOCC-core: conda install -c conda-forge pythonocc-core
2. Set USE_MOCK_CAD=false in environment
3. Restart the service
"""

import logging
import math
import os
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

# Toggle between mock and real implementation
USE_MOCK_CAD = os.getenv("USE_MOCK_CAD", "true").lower() == "true"

if not USE_MOCK_CAD:
    try:
        from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
        from OCC.Core.TopExp import TopExp_Explorer
        from OCC.Core.TopAbs import TopAbs_FACE
        from OCC.Core.TopoDS import topods_Face
        from OCC.Core.BRep import BRep_Tool
        from OCC.Core.TopLoc import TopLoc_Location
        from OCC.Core.gp import gp_Pnt

        OCC_AVAILABLE = True
        logger.info("OpenCascade (pythonOCC) loaded successfully")
    except ImportError as e:
        OCC_AVAILABLE = False
        USE_MOCK_CAD = True
        logger.warning(f"OpenCascade not available, using mock implementation: {e}")
else:
    OCC_AVAILABLE = False
    logger.info("Using mock CAD implementation (USE_MOCK_CAD=true)")


def generate_mesh(occ_shape=None, geometry_type: str = "box", parameters: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Generate triangle mesh from OpenCascade shape.

    Args:
        occ_shape: OpenCascade TopoDS_Shape (optional if using mock)
        geometry_type: Type of geometry for mock generation
        parameters: Geometry parameters for mock generation

    Returns:
        Dictionary with vertices, indices, and normals arrays
        Format compatible with Three.js BufferGeometry

    Example:
        >>> mesh = generate_mesh(geometry_type="box", parameters={"width": 50, "height": 50, "depth": 50})
        >>> print(len(mesh["vertices"]))  # 72 (24 vertices * 3 coordinates)
    """
    if USE_MOCK_CAD or occ_shape is None:
        return _generate_mock_mesh(geometry_type, parameters or {})
    else:
        return _generate_occ_mesh(occ_shape)


def _generate_mock_mesh(geometry_type: str, parameters: Dict[str, float]) -> Dict[str, Any]:
    """Generate mock mesh data for testing without OpenCascade."""

    if geometry_type == "box":
        return _generate_box_mesh(
            parameters.get("width", 50),
            parameters.get("height", 50),
            parameters.get("depth", 50)
        )
    elif geometry_type == "cylinder":
        return _generate_cylinder_mesh(
            parameters.get("radius", 10),
            parameters.get("height", 20),
            parameters.get("segments", 32)
        )
    elif geometry_type == "sphere":
        return _generate_sphere_mesh(
            parameters.get("radius", 10),
            parameters.get("segments", 32)
        )
    else:
        # Default to a small box
        return _generate_box_mesh(10, 10, 10)


def _generate_box_mesh(width: float, height: float, depth: float) -> Dict[str, Any]:
    """Generate mesh for a box."""
    w, h, d = width / 2, height / 2, depth / 2

    # 24 vertices (4 per face * 6 faces) for proper normals
    vertices = [
        # Front face (z = d)
        -w, -h, d,   w, -h, d,   w, h, d,  -w, h, d,
        # Back face (z = -d)
        -w, -h, -d,  -w, h, -d,  w, h, -d,  w, -h, -d,
        # Top face (y = h)
        -w, h, -d,   -w, h, d,   w, h, d,   w, h, -d,
        # Bottom face (y = -h)
        -w, -h, -d,  w, -h, -d,  w, -h, d,  -w, -h, d,
        # Right face (x = w)
        w, -h, -d,   w, h, -d,   w, h, d,   w, -h, d,
        # Left face (x = -w)
        -w, -h, -d,  -w, -h, d,  -w, h, d,  -w, h, -d,
    ]

    # Triangle indices (2 triangles per face * 6 faces = 12 triangles = 36 indices)
    indices = [
        0, 1, 2,  0, 2, 3,     # Front
        4, 5, 6,  4, 6, 7,     # Back
        8, 9, 10, 8, 10, 11,   # Top
        12, 13, 14, 12, 14, 15, # Bottom
        16, 17, 18, 16, 18, 19, # Right
        20, 21, 22, 20, 22, 23, # Left
    ]

    # Normals (one per vertex, matching vertex order)
    normals = [
        # Front
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        # Back
        0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
        # Top
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        # Bottom
        0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
        # Right
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
        # Left
        -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    ]

    return {
        "vertices": vertices,
        "indices": indices,
        "normals": normals,
        "vertex_count": 24,
        "triangle_count": 12,
    }


def _generate_cylinder_mesh(radius: float, height: float, segments: int = 32) -> Dict[str, Any]:
    """Generate mesh for a cylinder."""
    vertices = []
    indices = []
    normals = []

    h = height / 2

    # Generate vertices for top and bottom circles + sides
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)

        # Bottom vertex
        vertices.extend([x, -h, z])
        normals.extend([x / radius, 0, z / radius])  # Side normal

        # Top vertex
        vertices.extend([x, h, z])
        normals.extend([x / radius, 0, z / radius])  # Side normal

    # Add center vertices for caps
    bottom_center_idx = len(vertices) // 3
    vertices.extend([0, -h, 0])
    normals.extend([0, -1, 0])

    top_center_idx = len(vertices) // 3
    vertices.extend([0, h, 0])
    normals.extend([0, 1, 0])

    # Generate indices for sides
    for i in range(segments):
        next_i = (i + 1) % segments

        # Side face (2 triangles per segment)
        bottom_curr = i * 2
        top_curr = i * 2 + 1
        bottom_next = next_i * 2
        top_next = next_i * 2 + 1

        indices.extend([bottom_curr, top_curr, bottom_next])
        indices.extend([bottom_next, top_curr, top_next])

        # Bottom cap
        indices.extend([bottom_center_idx, bottom_next, bottom_curr])

        # Top cap
        indices.extend([top_center_idx, top_curr, top_next])

    return {
        "vertices": vertices,
        "indices": indices,
        "normals": normals,
        "vertex_count": len(vertices) // 3,
        "triangle_count": len(indices) // 3,
    }


def _generate_sphere_mesh(radius: float, segments: int = 32) -> Dict[str, Any]:
    """Generate mesh for a sphere using UV sphere algorithm."""
    vertices = []
    indices = []
    normals = []

    rings = segments // 2

    # Generate vertices
    for ring in range(rings + 1):
        phi = math.pi * ring / rings
        for seg in range(segments):
            theta = 2 * math.pi * seg / segments

            x = radius * math.sin(phi) * math.cos(theta)
            y = radius * math.cos(phi)
            z = radius * math.sin(phi) * math.sin(theta)

            vertices.extend([x, y, z])

            # Normal is just normalized position for sphere
            normals.extend([x / radius, y / radius, z / radius])

    # Generate indices
    for ring in range(rings):
        for seg in range(segments):
            current = ring * segments + seg
            next_seg = ring * segments + (seg + 1) % segments
            next_ring = (ring + 1) * segments + seg
            next_ring_next = (ring + 1) * segments + (seg + 1) % segments

            # Two triangles per quad
            if ring < rings:
                indices.extend([current, next_ring, next_seg])
                indices.extend([next_seg, next_ring, next_ring_next])

    return {
        "vertices": vertices,
        "indices": indices,
        "normals": normals,
        "vertex_count": len(vertices) // 3,
        "triangle_count": len(indices) // 3,
    }


def _generate_occ_mesh(occ_shape) -> Dict[str, Any]:
    """
    Generate mesh from real OpenCascade shape.

    This function uses pythonOCC to triangulate the shape and extract
    vertex positions, triangle indices, and normals.
    """
    if not OCC_AVAILABLE:
        raise RuntimeError("OpenCascade is not available. Set USE_MOCK_CAD=true to use mock implementation.")

    # Mesh the shape
    mesh = BRepMesh_IncrementalMesh(occ_shape, 0.1)  # 0.1 is deflection/tolerance
    mesh.Perform()

    if not mesh.IsDone():
        raise RuntimeError("Failed to mesh the shape")

    vertices = []
    normals = []
    indices = []

    # Iterate over faces
    face_explorer = TopExp_Explorer(occ_shape, TopAbs_FACE)

    offset = 0
    while face_explorer.More():
        face = topods_Face(face_explorer.Current())
        location = TopLoc_Location()
        triangulation = BRep_Tool.Triangulation(face, location)

        if triangulation is not None:
            # Get transformation
            transform = location.Transformation()

            # Extract vertices
            for i in range(1, triangulation.NbNodes() + 1):
                pnt = triangulation.Node(i)
                pnt.Transform(transform)
                vertices.extend([pnt.X(), pnt.Y(), pnt.Z()])
                # Normals would be computed from triangulation.Normal(i) if available
                normals.extend([0, 1, 0])  # Placeholder

            # Extract triangles
            for i in range(1, triangulation.NbTriangles() + 1):
                triangle = triangulation.Triangle(i)
                n1, n2, n3 = triangle.Get()
                indices.extend([offset + n1 - 1, offset + n2 - 1, offset + n3 - 1])

            offset += triangulation.NbNodes()

        face_explorer.Next()

    return {
        "vertices": vertices,
        "indices": indices,
        "normals": normals,
        "vertex_count": len(vertices) // 3,
        "triangle_count": len(indices) // 3,
    }


def get_mesh_info() -> Dict[str, Any]:
    """Get information about the mesh generator configuration."""
    return {
        "use_mock": USE_MOCK_CAD,
        "occ_available": OCC_AVAILABLE,
        "backend": "OpenCascade (pythonOCC)" if OCC_AVAILABLE and not USE_MOCK_CAD else "Mock Implementation",
    }
