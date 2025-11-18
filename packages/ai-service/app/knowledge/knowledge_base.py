"""
Knowledge Base for CAD Engineering Facts.

This module provides a simple knowledge base with common engineering facts,
dimensions, and specifications. In production, this would be replaced with
a vector database like Pinecone for semantic search.
"""

from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


# Engineering knowledge database
ENGINEERING_KNOWLEDGE = {
    "motors": {
        "NEMA 23": {
            "width": 57,  # mm
            "height": 57,  # mm
            "mounting_holes": {
                "pattern": "square",
                "spacing": 47.14,  # mm center-to-center
                "diameter": 5.2,  # mm (for M5 screws)
            },
            "shaft_diameter": 6.35,  # mm (1/4")
            "shaft_length": 24,  # mm (typical)
            "description": "Standard NEMA 23 stepper motor dimensions",
        },
        "NEMA 17": {
            "width": 42,  # mm
            "height": 42,  # mm
            "mounting_holes": {
                "pattern": "square",
                "spacing": 31,  # mm center-to-center
                "diameter": 3.2,  # mm (for M3 screws)
            },
            "shaft_diameter": 5,  # mm
            "shaft_length": 24,  # mm (typical)
            "description": "Standard NEMA 17 stepper motor dimensions",
        },
    },
    "fasteners": {
        "M3": {
            "thread_diameter": 3.0,  # mm
            "pitch": 0.5,  # mm
            "clearance_hole": 3.4,  # mm
            "tap_drill": 2.5,  # mm
            "head_types": ["socket_cap", "button_head", "flat_head"],
            "description": "M3 metric screw specifications",
        },
        "M5": {
            "thread_diameter": 5.0,  # mm
            "pitch": 0.8,  # mm
            "clearance_hole": 5.5,  # mm
            "tap_drill": 4.2,  # mm
            "head_types": ["socket_cap", "button_head", "flat_head"],
            "description": "M5 metric screw specifications",
        },
        "M8": {
            "thread_diameter": 8.0,  # mm
            "pitch": 1.25,  # mm
            "clearance_hole": 9.0,  # mm
            "tap_drill": 6.8,  # mm
            "head_types": ["socket_cap", "button_head", "flat_head"],
            "description": "M8 metric screw specifications",
        },
    },
    "materials": {
        "Aluminum 6061-T6": {
            "density": 2.7,  # g/cm³
            "tensile_strength": 310,  # MPa
            "yield_strength": 276,  # MPa
            "hardness": 95,  # HB
            "elastic_modulus": 69,  # GPa
            "thermal_conductivity": 167,  # W/m·K
            "description": "Common aluminum alloy for machining",
        },
        "Steel 1045": {
            "density": 7.85,  # g/cm³
            "tensile_strength": 625,  # MPa
            "yield_strength": 530,  # MPa
            "hardness": 187,  # HB
            "elastic_modulus": 205,  # GPa
            "thermal_conductivity": 49.8,  # W/m·K
            "description": "Medium carbon steel for general purpose",
        },
        "ABS Plastic": {
            "density": 1.05,  # g/cm³
            "tensile_strength": 40,  # MPa
            "yield_strength": 38,  # MPa
            "hardness": 108,  # Rockwell R
            "elastic_modulus": 2.3,  # GPa
            "thermal_conductivity": 0.25,  # W/m·K
            "description": "Common 3D printing thermoplastic",
        },
    },
    "tolerances": {
        "general": {
            "description": "General machining tolerances",
            "precision": 0.1,  # mm
            "fine": 0.05,  # mm
            "very_fine": 0.01,  # mm
        },
        "3d_printing": {
            "description": "3D printing tolerances",
            "fdm": 0.2,  # mm
            "sla": 0.05,  # mm
            "sls": 0.15,  # mm
        },
    },
    "common_dimensions": {
        "clearances": {
            "tight_fit": 0.05,  # mm
            "slip_fit": 0.1,  # mm
            "loose_fit": 0.2,  # mm
        },
        "corner_radii": {
            "minimum_internal": 0.5,  # mm (for machining)
            "standard": 2.0,  # mm
            "large": 5.0,  # mm
        },
        "wall_thickness": {
            "minimum_3d_print": 0.8,  # mm
            "minimum_machined": 2.0,  # mm
            "standard": 3.0,  # mm
        },
    },
}


class KnowledgeBase:
    """Knowledge base for engineering facts and specifications."""

    def __init__(self):
        """Initialize the knowledge base."""
        self.knowledge = ENGINEERING_KNOWLEDGE
        logger.info("Knowledge base initialized with engineering facts")

    def search(self, query: str, category: str = None) -> List[Dict[str, Any]]:
        """
        Search the knowledge base for relevant information.

        Args:
            query: Search query (e.g., "NEMA 23", "M5 screw")
            category: Optional category to search in (e.g., "motors", "fasteners")

        Returns:
            List of matching knowledge entries
        """
        query_lower = query.lower()
        results = []

        # Determine search scope
        search_dict = (
            self.knowledge.get(category, {}) if category else self.knowledge
        )

        # Simple keyword matching (in production, use vector similarity)
        for cat_name, cat_data in (
            search_dict.items() if not category else [(category, search_dict)]
        ):
            if isinstance(cat_data, dict):
                for item_name, item_data in cat_data.items():
                    # Check if query matches item name or description
                    name_match = query_lower in item_name.lower()
                    desc_match = False
                    if isinstance(item_data, dict) and "description" in item_data:
                        desc_match = query_lower in item_data["description"].lower()

                    if name_match or desc_match:
                        results.append(
                            {
                                "category": cat_name,
                                "name": item_name,
                                "data": item_data,
                                "relevance": 1.0 if name_match else 0.5,
                            }
                        )

        # Sort by relevance
        results.sort(key=lambda x: x["relevance"], reverse=True)

        logger.info(f"Knowledge search for '{query}' returned {len(results)} results")
        return results

    def get_motor_dimensions(self, motor_type: str) -> Dict[str, Any]:
        """Get motor dimensions by type (e.g., 'NEMA 23')."""
        return self.knowledge.get("motors", {}).get(motor_type, {})

    def get_fastener_specs(self, fastener_type: str) -> Dict[str, Any]:
        """Get fastener specifications (e.g., 'M5')."""
        return self.knowledge.get("fasteners", {}).get(fastener_type, {})

    def get_material_properties(self, material_name: str) -> Dict[str, Any]:
        """Get material properties."""
        return self.knowledge.get("materials", {}).get(material_name, {})

    def get_tolerance(self, tolerance_type: str) -> Dict[str, Any]:
        """Get tolerance specifications."""
        return self.knowledge.get("tolerances", {}).get(tolerance_type, {})

    def get_all_categories(self) -> List[str]:
        """Get list of all knowledge categories."""
        return list(self.knowledge.keys())


# Global instance
knowledge_base = KnowledgeBase()


def search_knowledge(query: str, category: str = None) -> List[Dict[str, Any]]:
    """
    Convenience function to search the global knowledge base.

    Args:
        query: Search query
        category: Optional category to filter by

    Returns:
        List of matching knowledge entries

    Example:
        >>> results = search_knowledge("NEMA 23")
        >>> motor_data = results[0]["data"]
        >>> print(motor_data["width"])  # 57
    """
    return knowledge_base.search(query, category)
