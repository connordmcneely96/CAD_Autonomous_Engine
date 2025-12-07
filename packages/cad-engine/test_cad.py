"""
Quick test script to verify CAD engine functionality.
Run this after installing dependencies to ensure OpenCascade is working.
"""

import sys
sys.path.insert(0, '.')

from app.core.kernel import CADKernel
import json

def test_basic_operations():
    """Test basic CAD operations"""
    print("=" * 60)
    print("CAD Engine Test Suite")
    print("=" * 60)
    
    kernel = CADKernel()
    
    # Test 1: Create a box
    print("\n1. Creating box...")
    box = kernel.create_box(100, 50, 30)
    print(f"   ✓ Box created: {box}")
    
    # Test 2: Create a cylinder
    print("\n2. Creating cylinder...")
    cylinder = kernel.create_cylinder(25, 80)
    print(f"   ✓ Cylinder created: {cylinder}")
    
    # Test 3: Boolean subtract
    print("\n3. Performing boolean subtract...")
    result = kernel.subtract(box, cylinder)
    print(f"   ✓ Subtraction completed: {result}")
    
    # Test 4: Apply fillet
    print("\n4. Applying fillet...")
    filleted = kernel.fillet_edges(result, 5.0)
    print(f"   ✓ Fillet applied: {filleted}")
    
    # Test 5: Generate mesh
    print("\n5. Generating mesh for Three.js...")
    mesh = kernel.generate_mesh(filleted)
    print(f"   ✓ Mesh generated:")
    print(f"      - Vertices: {len(mesh['vertices'])//3}")
    print(f"      - Triangles: {len(mesh['indices'])//3}")
    print(f"      - Normals: {len(mesh['normals'])//3}")
    
    # Test 6: Export STEP
    print("\n6. Exporting to STEP...")
    kernel.export_step(filleted, "/tmp/test.step")
    print("   ✓ STEP file exported to /tmp/test.step")
    
    # Test 7: Export STL
    print("\n7. Exporting to STL...")
    kernel.export_stl(filleted, "/tmp/test.stl")
    print("   ✓ STL file exported to /tmp/test.stl")
    
    # Test 8: Feature history
    print("\n8. Checking feature history...")
    history = kernel.get_history()
    print(f"   ✓ History contains {len(history)} operations:")
    for i, op in enumerate(history, 1):
        print(f"      {i}. {op['type']}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✓")
    print("=" * 60)
    print("\nCAD Engine is working correctly!")
    print("You can now start the API server with:")
    print("  uvicorn app.main:app --reload")

if __name__ == "__main__":
    try:
        test_basic_operations()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
