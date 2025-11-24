"""
CAD Kernel - OpenCascade Technology (OCCT) Wrapper
==================================================

This module provides a Python interface to OpenCascade for parametric CAD modeling.
It's the core of the CAD engine, handling:
- Primitive creation (box, cylinder, sphere, cone)
- Boolean operations (union, subtract, intersect)
- Fillets and chamfers
- Transformations (translate, rotate, scale)
- Mesh generation for Three.js visualization
- STEP/IGES/STL export

OpenCascade is used by professional CAD software like FreeCAD and Salome.
"""

from OCP.BRepPrimAPI import (
    BRepPrimAPI_MakeBox,
    BRepPrimAPI_MakeCylinder,
    BRepPrimAPI_MakeSphere,
    BRepPrimAPI_MakeCone,
)
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform, BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace
from OCP.BRepFilletAPI import BRepFilletAPI_MakeFillet, BRepFilletAPI_MakeChamfer
from OCP.BRepAlgoAPI import (
    BRepAlgoAPI_Fuse,
    BRepAlgoAPI_Cut,
    BRepAlgoAPI_Common,
)
from OCP.gp import gp_Pnt, gp_Vec, gp_Trsf, gp_Ax2, gp_Dir, gp_Ax1
from OCP.TopoDS import TopoDS_Shape, TopoDS_Edge
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE, TopAbs_FACE
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRep import BRep_Tool
from OCP.StlAPI import StlAPI_Writer
from OCP.STEPControl import STEPControl_Writer, STEPControl_AsIs
from OCP.TopLoc import TopLoc_Location
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class CADKernel:
    """
    Core CAD operations using OpenCascade Technology.
    This is the heart of the parametric modeling engine.
    """

    def __init__(self):
        self.shape: Optional[TopoDS_Shape] = None
        self.history: List[Dict[str, Any]] = []

    # ===== PRIMITIVE CREATION =====

    def create_box(
        self,
        width: float,
        height: float,
        depth: float,
        center: Tuple[float, float, float] = (0, 0, 0),
    ) -> TopoDS_Shape:
        """
        Create a rectangular box (like SolidWorks Boss Extrude base).
        
        Args:
            width: Box width (X dimension)
            height: Box height (Y dimension)
            depth: Box depth (Z dimension)
            center: Center point of the box
        
        Returns:
            TopoDS_Shape: The created box shape
        """
        try:
            x, y, z = center
            box = BRepPrimAPI_MakeBox(
                gp_Pnt(x - width / 2, y - height / 2, z - depth / 2),
                width,
                height,
                depth,
            ).Shape()

            self.shape = box
            self.history.append(
                {
                    "type": "box",
                    "params": {
                        "width": width,
                        "height": height,
                        "depth": depth,
                        "center": center,
                    },
                }
            )
            logger.info(f"Created box: {width}x{height}x{depth} at {center}")
            return box
        except Exception as e:
            logger.error(f"Error creating box: {e}")
            raise

    def create_cylinder(
        self,
        radius: float,
        height: float,
        center: Tuple[float, float, float] = (0, 0, 0),
        axis: Tuple[float, float, float] = (0, 0, 1),
    ) -> TopoDS_Shape:
        """
        Create a cylinder (like SolidWorks Revolve).
        
        Args:
            radius: Cylinder radius
            height: Cylinder height
            center: Center point at the base
            axis: Direction vector for cylinder axis
        
        Returns:
            TopoDS_Shape: The created cylinder shape
        """
        try:
            x, y, z = center
            dx, dy, dz = axis

            axis_point = gp_Pnt(x, y, z)
            axis_dir = gp_Dir(dx, dy, dz)
            axis_system = gp_Ax2(axis_point, axis_dir)

            cylinder = BRepPrimAPI_MakeCylinder(axis_system, radius, height).Shape()

            self.shape = cylinder
            self.history.append(
                {
                    "type": "cylinder",
                    "params": {
                        "radius": radius,
                        "height": height,
                        "center": center,
                        "axis": axis,
                    },
                }
            )
            logger.info(f"Created cylinder: r={radius}, h={height} at {center}")
            return cylinder
        except Exception as e:
            logger.error(f"Error creating cylinder: {e}")
            raise

    def create_sphere(
        self, radius: float, center: Tuple[float, float, float] = (0, 0, 0)
    ) -> TopoDS_Shape:
        """
        Create a sphere.
        
        Args:
            radius: Sphere radius
            center: Center point
        
        Returns:
            TopoDS_Shape: The created sphere shape
        """
        try:
            x, y, z = center
            sphere = BRepPrimAPI_MakeSphere(gp_Pnt(x, y, z), radius).Shape()

            self.shape = sphere
            self.history.append(
                {"type": "sphere", "params": {"radius": radius, "center": center}}
            )
            logger.info(f"Created sphere: r={radius} at {center}")
            return sphere
        except Exception as e:
            logger.error(f"Error creating sphere: {e}")
            raise

    def create_cone(
        self,
        radius1: float,
        radius2: float,
        height: float,
        center: Tuple[float, float, float] = (0, 0, 0),
        axis: Tuple[float, float, float] = (0, 0, 1),
    ) -> TopoDS_Shape:
        """
        Create a cone or truncated cone.
        
        Args:
            radius1: Bottom radius
            radius2: Top radius
            height: Cone height
            center: Center point at the base
            axis: Direction vector for cone axis
        
        Returns:
            TopoDS_Shape: The created cone shape
        """
        try:
            x, y, z = center
            dx, dy, dz = axis

            axis_point = gp_Pnt(x, y, z)
            axis_dir = gp_Dir(dx, dy, dz)
            axis_system = gp_Ax2(axis_point, axis_dir)

            cone = BRepPrimAPI_MakeCone(axis_system, radius1, radius2, height).Shape()

            self.shape = cone
            self.history.append(
                {
                    "type": "cone",
                    "params": {
                        "radius1": radius1,
                        "radius2": radius2,
                        "height": height,
                        "center": center,
                        "axis": axis,
                    },
                }
            )
            logger.info(f"Created cone: r1={radius1}, r2={radius2}, h={height}")
            return cone
        except Exception as e:
            logger.error(f"Error creating cone: {e}")
            raise

    # ===== BOOLEAN OPERATIONS =====

    def union(self, shape1: TopoDS_Shape, shape2: TopoDS_Shape) -> TopoDS_Shape:
        """
        Boolean union (combine two shapes).
        Like SolidWorks Combine.
        """
        try:
            result = BRepAlgoAPI_Fuse(shape1, shape2).Shape()
            self.shape = result
            self.history.append({"type": "union"})
            logger.info("Performed union operation")
            return result
        except Exception as e:
            logger.error(f"Error in union: {e}")
            raise

    def subtract(self, base: TopoDS_Shape, tool: TopoDS_Shape) -> TopoDS_Shape:
        """
        Boolean subtraction (cut hole).
        Like SolidWorks Cut Extrude.
        """
        try:
            result = BRepAlgoAPI_Cut(base, tool).Shape()
            self.shape = result
            self.history.append({"type": "subtract"})
            logger.info("Performed subtract operation")
            return result
        except Exception as e:
            logger.error(f"Error in subtract: {e}")
            raise

    def intersect(self, shape1: TopoDS_Shape, shape2: TopoDS_Shape) -> TopoDS_Shape:
        """Boolean intersection (keep only overlapping volume)."""
        try:
            result = BRepAlgoAPI_Common(shape1, shape2).Shape()
            self.shape = result
            self.history.append({"type": "intersect"})
            logger.info("Performed intersect operation")
            return result
        except Exception as e:
            logger.error(f"Error in intersect: {e}")
            raise

    # ===== FILLET AND CHAMFER =====

    def fillet_edges(
        self, shape: TopoDS_Shape, radius: float, edge_indices: Optional[List[int]] = None
    ) -> TopoDS_Shape:
        """
        Apply fillet to edges (like SolidWorks Fillet).
        
        Args:
            shape: Input shape
            radius: Fillet radius
            edge_indices: Specific edge indices to fillet (None = all edges)
        
        Returns:
            TopoDS_Shape: Shape with filleted edges
        """
        try:
            fillet = BRepFilletAPI_MakeFillet(shape)

            # If no specific edges, fillet all edges
            if edge_indices is None:
                explorer = TopExp_Explorer(shape, TopAbs_EDGE)
                edge_count = 0
                while explorer.More():
                    edge = TopoDS_Edge.DownCast(explorer.Current())
                    try:
                        fillet.Add(radius, edge)
                        edge_count += 1
                    except:
                        # Some edges may not be fillable
                        pass
                    explorer.Next()
                logger.info(f"Applied fillet to {edge_count} edges")
            else:
                # Fillet specific edges (TODO: implement edge selection by index)
                logger.warning("Specific edge selection not yet implemented")

            result = fillet.Shape()
            self.shape = result
            self.history.append({"type": "fillet", "params": {"radius": radius}})
            return result
        except Exception as e:
            logger.error(f"Error applying fillet: {e}")
            raise

    def chamfer_edges(
        self, shape: TopoDS_Shape, distance: float, edge_indices: Optional[List[int]] = None
    ) -> TopoDS_Shape:
        """
        Apply chamfer to edges.
        
        Args:
            shape: Input shape
            distance: Chamfer distance
            edge_indices: Specific edge indices to chamfer (None = all edges)
        
        Returns:
            TopoDS_Shape: Shape with chamfered edges
        """
        try:
            chamfer = BRepFilletAPI_MakeChamfer(shape)

            if edge_indices is None:
                explorer = TopExp_Explorer(shape, TopAbs_EDGE)
                edge_count = 0
                while explorer.More():
                    edge = TopoDS_Edge.DownCast(explorer.Current())
                    try:
                        chamfer.Add(distance, edge)
                        edge_count += 1
                    except:
                        pass
                    explorer.Next()
                logger.info(f"Applied chamfer to {edge_count} edges")

            result = chamfer.Shape()
            self.shape = result
            self.history.append({"type": "chamfer", "params": {"distance": distance}})
            return result
        except Exception as e:
            logger.error(f"Error applying chamfer: {e}")
            raise

    # ===== TRANSFORMATIONS =====

    def translate(
        self, shape: TopoDS_Shape, vector: Tuple[float, float, float]
    ) -> TopoDS_Shape:
        """Move shape by vector."""
        try:
            dx, dy, dz = vector
            transform = gp_Trsf()
            transform.SetTranslation(gp_Vec(dx, dy, dz))

            result = BRepBuilderAPI_Transform(shape, transform).Shape()
            self.shape = result
            self.history.append({"type": "translate", "params": {"vector": vector}})
            logger.info(f"Translated shape by {vector}")
            return result
        except Exception as e:
            logger.error(f"Error translating: {e}")
            raise

    def rotate(
        self,
        shape: TopoDS_Shape,
        axis: Tuple[float, float, float],
        angle_degrees: float,
        center: Tuple[float, float, float] = (0, 0, 0),
    ) -> TopoDS_Shape:
        """Rotate shape around axis."""
        try:
            x, y, z = center
            dx, dy, dz = axis

            transform = gp_Trsf()
            axis_point = gp_Pnt(x, y, z)
            axis_dir = gp_Dir(dx, dy, dz)

            transform.SetRotation(gp_Ax1(axis_point, axis_dir), np.radians(angle_degrees))

            result = BRepBuilderAPI_Transform(shape, transform).Shape()
            self.shape = result
            self.history.append(
                {
                    "type": "rotate",
                    "params": {"axis": axis, "angle": angle_degrees, "center": center},
                }
            )
            logger.info(f"Rotated shape {angle_degrees}° around {axis}")
            return result
        except Exception as e:
            logger.error(f"Error rotating: {e}")
            raise

    def scale(
        self, shape: TopoDS_Shape, factor: float, center: Tuple[float, float, float] = (0, 0, 0)
    ) -> TopoDS_Shape:
        """Scale shape uniformly."""
        try:
            x, y, z = center
            transform = gp_Trsf()
            transform.SetScale(gp_Pnt(x, y, z), factor)

            result = BRepBuilderAPI_Transform(shape, transform).Shape()
            self.shape = result
            self.history.append({"type": "scale", "params": {"factor": factor, "center": center}})
            logger.info(f"Scaled shape by factor {factor}")
            return result
        except Exception as e:
            logger.error(f"Error scaling: {e}")
            raise

    # ===== MESH GENERATION =====

    def generate_mesh(
        self, shape: TopoDS_Shape, linear_deflection: float = 0.1, angular_deflection: float = 0.5
    ) -> Dict[str, List[float]]:
        """
        Generate triangular mesh for visualization in Three.js.
        
        Args:
            shape: Shape to mesh
            linear_deflection: Maximum distance between mesh and actual surface
            angular_deflection: Maximum angle deviation in degrees
        
        Returns:
            Dictionary with 'vertices', 'normals', and 'indices' arrays for Three.js
        """
        try:
            # Mesh the shape with specified deflection
            BRepMesh_IncrementalMesh(shape, linear_deflection, False, angular_deflection)

            vertices = []
            normals = []
            indices = []
            vertex_index = 0

            # Extract triangles from all faces
            explorer = TopExp_Explorer(shape, TopAbs_FACE)

            while explorer.More():
                face = explorer.Current()
                location = TopLoc_Location()
                triangulation = BRep_Tool.Triangulation_s(face, location)

                if triangulation:
                    transform = location.Transformation()

                    # Get vertices
                    for i in range(1, triangulation.NbNodes() + 1):
                        pnt = triangulation.Node(i)
                        pnt.Transform(transform)
                        vertices.extend([pnt.X(), pnt.Y(), pnt.Z()])

                    # Get triangles
                    for i in range(1, triangulation.NbTriangles() + 1):
                        triangle = triangulation.Triangle(i)
                        n1, n2, n3 = triangle.Get()

                        # Adjust indices (OCC is 1-indexed, Three.js is 0-indexed)
                        indices.extend([vertex_index + n1 - 1, vertex_index + n2 - 1, vertex_index + n3 - 1])

                    vertex_index += triangulation.NbNodes()

                explorer.Next()

            # Calculate normals (simple flat shading)
            for i in range(0, len(indices), 3):
                i1, i2, i3 = indices[i], indices[i + 1], indices[i + 2]

                v1 = np.array(vertices[i1 * 3 : i1 * 3 + 3])
                v2 = np.array(vertices[i2 * 3 : i2 * 3 + 3])
                v3 = np.array(vertices[i3 * 3 : i3 * 3 + 3])

                # Calculate face normal
                edge1 = v2 - v1
                edge2 = v3 - v1
                normal = np.cross(edge1, edge2)
                norm_length = np.linalg.norm(normal)
                if norm_length > 0:
                    normal = normal / norm_length

                # Add same normal for all 3 vertices (flat shading)
                normals.extend(normal.tolist())
                normals.extend(normal.tolist())
                normals.extend(normal.tolist())

            logger.info(f"Generated mesh: {len(vertices)//3} vertices, {len(indices)//3} triangles")

            return {"vertices": vertices, "normals": normals, "indices": indices}
        except Exception as e:
            logger.error(f"Error generating mesh: {e}")
            raise

    # ===== EXPORT =====

    def export_step(self, shape: TopoDS_Shape, filepath: str):
        """Export to STEP format (industry standard for CAD interchange)."""
        try:
            writer = STEPControl_Writer()
            writer.Transfer(shape, STEPControl_AsIs)
            status = writer.Write(filepath)
            logger.info(f"Exported STEP to {filepath}, status: {status}")
            return status
        except Exception as e:
            logger.error(f"Error exporting STEP: {e}")
            raise

    def export_stl(self, shape: TopoDS_Shape, filepath: str):
        """Export to STL format (for 3D printing)."""
        try:
            # First mesh the shape
            BRepMesh_IncrementalMesh(shape, 0.1, False, 0.5)

            writer = StlAPI_Writer()
            writer.Write(shape, filepath)
            logger.info(f"Exported STL to {filepath}")
        except Exception as e:
            logger.error(f"Error exporting STL: {e}")
            raise

    # ===== PARAMETRIC SUPPORT =====

    def rebuild_from_history(self, history: List[Dict[str, Any]]) -> TopoDS_Shape:
        """
        Rebuild shape from feature history.
        This is key to parametric modeling - change a parameter, rebuild.
        
        Args:
            history: List of feature dictionaries
        
        Returns:
            TopoDS_Shape: Reconstructed shape
        """
        result = None

        for feature in history:
            try:
                if feature["type"] == "box":
                    p = feature["params"]
                    result = self.create_box(p["width"], p["height"], p["depth"], p.get("center", (0, 0, 0)))

                elif feature["type"] == "cylinder":
                    p = feature["params"]
                    result = self.create_cylinder(
                        p["radius"], p["height"], p.get("center", (0, 0, 0)), p.get("axis", (0, 0, 1))
                    )

                elif feature["type"] == "sphere":
                    p = feature["params"]
                    result = self.create_sphere(p["radius"], p.get("center", (0, 0, 0)))

                elif feature["type"] == "cone":
                    p = feature["params"]
                    result = self.create_cone(
                        p["radius1"], p["radius2"], p["height"], p.get("center", (0, 0, 0)), p.get("axis", (0, 0, 1))
                    )

                # Boolean operations require tracking multiple shapes
                # This would need a more sophisticated state management system

            except Exception as e:
                logger.error(f"Error rebuilding feature {feature['type']}: {e}")
                raise

        return result

    def get_history(self) -> List[Dict[str, Any]]:
        """Get feature history (for parametric editing)."""
        return self.history

    def clear_history(self):
        """Clear feature history."""
        self.history = []
        self.shape = None
