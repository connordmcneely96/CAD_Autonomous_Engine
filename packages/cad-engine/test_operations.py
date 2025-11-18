#!/usr/bin/env python3
"""
Test script for CAD operations.

This script tests the CAD engine functionality including:
- Primitive creation (box, cylinder, sphere)
- Mesh generation
- Feature operations
- Export functions

Run with: python test_operations.py
"""

import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

from app.operations.primitives import create_box, create_cylinder, create_sphere
from app.operations.features import extrude, fillet
from app.export.formats import export_step, export_stl, export_obj
from app.geometry.mesh_generator import get_mesh_info


def print_section(title: str):
    """Print a section header."""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_mesh_info():
    """Test mesh generator info."""
    print_section("Mesh Generator Info")
    info = get_mesh_info()
    print(f"Backend: {info['backend']}")
    print(f"Using Mock: {info['use_mock']}")
    print(f"OpenCascade Available: {info['occ_available']}")
    print("✓ Mesh info retrieved successfully")


def test_primitives():
    """Test primitive creation."""
    print_section("Testing Primitives")

    # Test box
    print("Creating 50mm cube...")
    box = create_box(50, 50, 50)
    print(f"  Feature ID: {box['feature_id']}")
    print(f"  Type: {box['type']}")
    print(f"  Vertices: {box['geometry']['vertex_count']}")
    print(f"  Triangles: {box['geometry']['triangle_count']}")
    assert box['geometry']['vertex_count'] == 24, "Box should have 24 vertices"
    assert box['geometry']['triangle_count'] == 12, "Box should have 12 triangles"
    print("✓ Box creation successful")

    # Test cylinder
    print("\nCreating cylinder (radius=10mm, height=20mm)...")
    cylinder = create_cylinder(10, 20, segments=32)
    print(f"  Feature ID: {cylinder['feature_id']}")
    print(f"  Type: {cylinder['type']}")
    print(f"  Vertices: {cylinder['geometry']['vertex_count']}")
    print(f"  Triangles: {cylinder['geometry']['triangle_count']}")
    assert cylinder['geometry']['vertex_count'] > 0, "Cylinder should have vertices"
    print("✓ Cylinder creation successful")

    # Test sphere
    print("\nCreating sphere (radius=15mm)...")
    sphere = create_sphere(15, segments=32)
    print(f"  Feature ID: {sphere['feature_id']}")
    print(f"  Type: {sphere['type']}")
    print(f"  Vertices: {sphere['geometry']['vertex_count']}")
    print(f"  Triangles: {sphere['geometry']['triangle_count']}")
    assert sphere['geometry']['vertex_count'] > 0, "Sphere should have vertices"
    print("✓ Sphere creation successful")

    return box, cylinder, sphere


def test_features(box):
    """Test feature operations."""
    print_section("Testing Feature Operations")

    # Test extrude
    print("Testing extrude operation...")
    sketch_data = {"type": "rectangle", "width": 20, "height": 30}
    extruded = extrude(sketch_data, distance=50)
    print(f"  Feature ID: {extruded['feature_id']}")
    print(f"  Type: {extruded['type']}")
    print("✓ Extrude operation successful")

    # Test fillet
    print("\nTesting fillet operation...")
    filleted = fillet(box, edges=[0, 1, 2, 3], radius=5)
    print(f"  Feature ID: {filleted['feature_id']}")
    print(f"  Type: {filleted['type']}")
    print(f"  Radius: {filleted['parameters']['radius']}mm")
    print("✓ Fillet operation successful")

    return extruded, filleted


def test_exports(box):
    """Test export operations."""
    print_section("Testing Export Functions")

    # Test STEP export
    print("Exporting to STEP format...")
    step_result = export_step(box, "test-box")
    print(f"  File: {step_result['filename']}")
    print(f"  Path: {step_result['file_path']}")
    print(f"  Size: {step_result['size_bytes']} bytes")
    assert os.path.exists(step_result['file_path']), "STEP file should exist"
    print("✓ STEP export successful")

    # Test STL export (ASCII)
    print("\nExporting to STL format (ASCII)...")
    stl_result = export_stl(box, "test-box-ascii", ascii_mode=True)
    print(f"  File: {stl_result['filename']}")
    print(f"  Path: {stl_result['file_path']}")
    print(f"  Size: {stl_result['size_bytes']} bytes")
    print(f"  ASCII: {stl_result['ascii']}")
    assert os.path.exists(stl_result['file_path']), "STL file should exist"
    print("✓ STL (ASCII) export successful")

    # Test STL export (Binary)
    print("\nExporting to STL format (Binary)...")
    stl_bin_result = export_stl(box, "test-box-binary", ascii_mode=False)
    print(f"  File: {stl_bin_result['filename']}")
    print(f"  Size: {stl_bin_result['size_bytes']} bytes")
    print("✓ STL (Binary) export successful")

    # Test OBJ export
    print("\nExporting to OBJ format...")
    obj_result = export_obj(box, "test-box")
    print(f"  File: {obj_result['filename']}")
    print(f"  Path: {obj_result['file_path']}")
    print(f"  Size: {obj_result['size_bytes']} bytes")
    assert os.path.exists(obj_result['file_path']), "OBJ file should exist"
    print("✓ OBJ export successful")

    return step_result, stl_result, obj_result


def test_mesh_data(geometry):
    """Test mesh data structure."""
    print_section("Testing Mesh Data Structure")

    mesh = geometry['geometry']

    print("Checking mesh data format...")
    assert 'vertices' in mesh, "Mesh should have vertices"
    assert 'indices' in mesh, "Mesh should have indices"
    assert 'normals' in mesh, "Mesh should have normals"

    print(f"  Vertices array length: {len(mesh['vertices'])}")
    print(f"  Indices array length: {len(mesh['indices'])}")
    print(f"  Normals array length: {len(mesh['normals'])}")

    # Verify array sizes
    vertex_count = len(mesh['vertices']) // 3
    normal_count = len(mesh['normals']) // 3
    triangle_count = len(mesh['indices']) // 3

    print(f"\n  Calculated vertex count: {vertex_count}")
    print(f"  Calculated normal count: {normal_count}")
    print(f"  Calculated triangle count: {triangle_count}")

    assert vertex_count == normal_count, "Vertices and normals counts should match"
    assert len(mesh['indices']) % 3 == 0, "Indices should be divisible by 3"

    print("\n✓ Mesh data structure is valid")


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("  CAD ENGINE TEST SUITE")
    print("="*70)

    try:
        # Test 1: Mesh generator info
        test_mesh_info()

        # Test 2: Create primitives
        box, cylinder, sphere = test_primitives()

        # Test 3: Test mesh data format
        test_mesh_data(box)

        # Test 4: Feature operations
        extruded, filleted = test_features(box)

        # Test 5: Export functions
        step_file, stl_file, obj_file = test_exports(box)

        # Summary
        print_section("Test Summary")
        print("✓ All tests passed successfully!")
        print(f"\nGenerated files:")
        print(f"  - {step_file['file_path']}")
        print(f"  - {stl_file['file_path']}")
        print(f"  - {obj_file['file_path']}")

        print(f"\nTotal features created: 5")
        print(f"  - Primitives: 3 (box, cylinder, sphere)")
        print(f"  - Features: 2 (extrude, fillet)")

        print("\n" + "="*70)
        print("  TEST SUITE COMPLETED")
        print("="*70 + "\n")

        return 0

    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
