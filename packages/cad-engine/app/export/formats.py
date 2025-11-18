"""
CAD Export Functions

This module provides export functionality for various CAD formats:
- STEP (.step, .stp): ISO 10303-21 format for 3D models
- STL (.stl): STereoLithography format for 3D printing
- OBJ (.obj): Wavefront OBJ format for visualization

Currently using MOCK implementation. Real export requires pythonOCC-core.
"""

import logging
import os
import tempfile
import uuid
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

USE_MOCK_CAD = os.getenv("USE_MOCK_CAD", "true").lower() == "true"

if not USE_MOCK_CAD:
    try:
        from OCC.Extend.DataExchange import write_step_file, write_stl_file
        OCC_AVAILABLE = True
        logger.info("OpenCascade export loaded successfully")
    except ImportError:
        OCC_AVAILABLE = False
        USE_MOCK_CAD = True
        logger.warning("OpenCascade not available, using mock export")
else:
    OCC_AVAILABLE = False


def export_step(
    geometry: Dict[str, Any],
    filename: Optional[str] = None
) -> Dict[str, Any]:
    """
    Export geometry to STEP format.

    STEP (STandard for the Exchange of Product model data) is an
    ISO standard for representing 3D product information.

    Args:
        geometry: Geometry dictionary containing feature data
        filename: Optional custom filename (without extension)

    Returns:
        Dictionary with:
        - file_path: Path to exported file
        - file_url: URL for download (if uploaded)
        - format: "step"
        - size_bytes: File size

    Example:
        >>> box = create_box(50, 50, 50)
        >>> result = export_step(box)
        >>> print(result["format"])
        "step"
    """
    if filename is None:
        filename = f"{geometry.get('type', 'model')}-{uuid.uuid4().hex[:8]}"

    if not filename.endswith('.step') and not filename.endswith('.stp'):
        filename += '.step'

    if USE_MOCK_CAD:
        # Mock: Create a simple STEP file with metadata
        file_path = _create_mock_step_file(geometry, filename)
    else:
        if not OCC_AVAILABLE:
            raise RuntimeError("OpenCascade not available. Set USE_MOCK_CAD=true.")

        # Real implementation would use write_step_file
        raise NotImplementedError("Real STEP export requires OCC shape")

    file_size = os.path.getsize(file_path)

    return {
        "file_path": file_path,
        "file_url": None,  # Would be set after upload to storage
        "format": "step",
        "filename": filename,
        "size_bytes": file_size,
        "feature_id": geometry.get("feature_id"),
    }


def export_stl(
    geometry: Dict[str, Any],
    filename: Optional[str] = None,
    ascii_mode: bool = False
) -> Dict[str, Any]:
    """
    Export geometry to STL format.

    STL (STereoLithography) is a common format for 3D printing
    and mesh-based modeling.

    Args:
        geometry: Geometry dictionary containing mesh data
        filename: Optional custom filename
        ascii_mode: If True, export ASCII STL; otherwise binary

    Returns:
        Dictionary with export information

    Example:
        >>> sphere = create_sphere(20)
        >>> result = export_stl(sphere)
        >>> print(result["format"])
        "stl"
    """
    if filename is None:
        filename = f"{geometry.get('type', 'model')}-{uuid.uuid4().hex[:8]}"

    if not filename.endswith('.stl'):
        filename += '.stl'

    if USE_MOCK_CAD:
        # Mock: Create STL from mesh data
        file_path = _create_mock_stl_file(geometry, filename, ascii_mode)
    else:
        if not OCC_AVAILABLE:
            raise RuntimeError("OpenCascade not available. Set USE_MOCK_CAD=true.")

        # Real implementation would use write_stl_file
        raise NotImplementedError("Real STL export requires OCC shape")

    file_size = os.path.getsize(file_path)

    return {
        "file_path": file_path,
        "file_url": None,
        "format": "stl",
        "filename": filename,
        "size_bytes": file_size,
        "ascii": ascii_mode,
        "feature_id": geometry.get("feature_id"),
    }


def export_obj(
    geometry: Dict[str, Any],
    filename: Optional[str] = None
) -> Dict[str, Any]:
    """
    Export geometry to OBJ format.

    OBJ (Wavefront) is a simple text-based format widely supported
    by 3D software and viewers.

    Args:
        geometry: Geometry dictionary containing mesh data
        filename: Optional custom filename

    Returns:
        Dictionary with export information
    """
    if filename is None:
        filename = f"{geometry.get('type', 'model')}-{uuid.uuid4().hex[:8]}"

    if not filename.endswith('.obj'):
        filename += '.obj'

    file_path = _create_obj_file(geometry, filename)
    file_size = os.path.getsize(file_path)

    return {
        "file_path": file_path,
        "file_url": None,
        "format": "obj",
        "filename": filename,
        "size_bytes": file_size,
        "feature_id": geometry.get("feature_id"),
    }


def _create_mock_step_file(geometry: Dict[str, Any], filename: str) -> str:
    """Create a mock STEP file with basic structure."""
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, filename)

    # Create a minimal STEP file
    content = f"""ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('CAD Model - Mock Export'),'2;1');
FILE_NAME('{filename}','2025-01-01T00:00:00',(''),(''),'','CAD Engine','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;
DATA;
/* Mock STEP data for {geometry.get('type', 'unknown')} */
/* Feature ID: {geometry.get('feature_id', 'unknown')} */
/* Parameters: {geometry.get('parameters', {})} */
#1=CARTESIAN_POINT('',(0.0,0.0,0.0));
#2=DIRECTION('',(0.0,0.0,1.0));
#3=AXIS2_PLACEMENT_3D('',#1,#2,#2);
ENDSEC;
END-ISO-10303-21;
"""

    with open(file_path, 'w') as f:
        f.write(content)

    logger.info(f"Created mock STEP file: {file_path}")
    return file_path


def _create_mock_stl_file(geometry: Dict[str, Any], filename: str, ascii_mode: bool) -> str:
    """Create a mock STL file from mesh data."""
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, filename)

    mesh = geometry.get("geometry", {})
    vertices = mesh.get("vertices", [])
    indices = mesh.get("indices", [])
    normals = mesh.get("normals", [])

    if ascii_mode:
        # ASCII STL format
        with open(file_path, 'w') as f:
            f.write(f"solid {geometry.get('feature_id', 'model')}\n")

            # Write each triangle
            for i in range(0, len(indices), 3):
                if i + 2 < len(indices):
                    idx1, idx2, idx3 = indices[i], indices[i + 1], indices[i + 2]

                    # Normal (simplified - just use first vertex normal)
                    if normals and idx1 * 3 + 2 < len(normals):
                        nx, ny, nz = normals[idx1*3:idx1*3+3]
                        f.write(f"  facet normal {nx} {ny} {nz}\n")
                    else:
                        f.write(f"  facet normal 0.0 0.0 1.0\n")

                    f.write("    outer loop\n")

                    # Vertices
                    for idx in [idx1, idx2, idx3]:
                        if idx * 3 + 2 < len(vertices):
                            x, y, z = vertices[idx*3:idx*3+3]
                            f.write(f"      vertex {x} {y} {z}\n")

                    f.write("    endloop\n")
                    f.write("  endfacet\n")

            f.write("endsolid\n")
    else:
        # Binary STL format (simplified)
        import struct

        with open(file_path, 'wb') as f:
            # Header (80 bytes)
            header = b'Binary STL from CAD Engine' + b' ' * (80 - len(b'Binary STL from CAD Engine'))
            f.write(header)

            # Number of triangles
            num_triangles = len(indices) // 3
            f.write(struct.pack('<I', num_triangles))

            # Write triangles (simplified)
            for i in range(0, len(indices), 3):
                if i + 2 < len(indices):
                    # Normal (placeholder)
                    f.write(struct.pack('<fff', 0.0, 0.0, 1.0))

                    # Vertices
                    for j in range(3):
                        idx = indices[i + j]
                        if idx * 3 + 2 < len(vertices):
                            x, y, z = vertices[idx*3:idx*3+3]
                            f.write(struct.pack('<fff', x, y, z))
                        else:
                            f.write(struct.pack('<fff', 0.0, 0.0, 0.0))

                    # Attribute byte count
                    f.write(struct.pack('<H', 0))

    logger.info(f"Created {'ASCII' if ascii_mode else 'binary'} STL file: {file_path}")
    return file_path


def _create_obj_file(geometry: Dict[str, Any], filename: str) -> str:
    """Create OBJ file from mesh data."""
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, filename)

    mesh = geometry.get("geometry", {})
    vertices = mesh.get("vertices", [])
    indices = mesh.get("indices", [])
    normals = mesh.get("normals", [])

    with open(file_path, 'w') as f:
        f.write(f"# Wavefront OBJ export from CAD Engine\n")
        f.write(f"# Feature: {geometry.get('type', 'unknown')}\n")
        f.write(f"# ID: {geometry.get('feature_id', 'unknown')}\n\n")

        f.write(f"o {geometry.get('feature_id', 'model')}\n\n")

        # Write vertices
        for i in range(0, len(vertices), 3):
            if i + 2 < len(vertices):
                x, y, z = vertices[i:i+3]
                f.write(f"v {x} {y} {z}\n")

        f.write("\n")

        # Write normals
        if normals:
            for i in range(0, len(normals), 3):
                if i + 2 < len(normals):
                    nx, ny, nz = normals[i:i+3]
                    f.write(f"vn {nx} {ny} {nz}\n")
            f.write("\n")

        # Write faces (OBJ indices are 1-based)
        for i in range(0, len(indices), 3):
            if i + 2 < len(indices):
                idx1, idx2, idx3 = indices[i] + 1, indices[i+1] + 1, indices[i+2] + 1
                if normals:
                    f.write(f"f {idx1}//{idx1} {idx2}//{idx2} {idx3}//{idx3}\n")
                else:
                    f.write(f"f {idx1} {idx2} {idx3}\n")

    logger.info(f"Created OBJ file: {file_path}")
    return file_path
