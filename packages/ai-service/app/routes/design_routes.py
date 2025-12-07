"""
Design Routes

API endpoints for AI-driven mechanical design using the
Primary Design Agent and MCP calculation servers.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.agents.primary_design_agent import primary_design_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/design", tags=["design"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ShaftDesignRequest(BaseModel):
    """Request for shaft design"""
    requirements: str = Field(
        ...,
        description="Natural language design requirements",
        examples=["Design a pump shaft for 100 HP at 3600 RPM with 2 inch overhang"]
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional context (project ID, existing designs, etc.)"
    )


class ShaftDesignResponse(BaseModel):
    """Response with complete shaft design"""
    success: bool
    design: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, Any]] = None
    requirements: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    iterations: Optional[list] = None
    converged: bool = False
    total_iterations: int = 0
    message: Optional[str] = None


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/shaft", response_model=ShaftDesignResponse)
async def design_shaft(request: ShaftDesignRequest):
    """
    Design a complete shaft from natural language requirements.

    This endpoint:
    1. Parses user requirements using Claude AI
    2. Generates initial design using MCP calculation server
    3. Validates design (deflection, critical speed, stress)
    4. Iterates until all criteria met
    5. Returns complete design with analysis

    **Example Request:**
    ```json
    {
      "requirements": "Design a pump shaft for 100 HP at 3600 RPM, 2 inch impeller overhang",
      "context": {
        "project_id": "proj-123"
      }
    }
    ```

    **Example Response:**
    ```json
    {
      "success": true,
      "design": {
        "diameter": 2.5,
        "length": 27,
        "material": "AISI 4140",
        "features": [...]
      },
      "analysis": {
        "deflection": {...},
        "critical_speed": {...},
        "stress": {...}
      },
      "summary": {
        "passed": true,
        "narrative": "Design converged after 2 iterations..."
      },
      "converged": true,
      "total_iterations": 2
    }
    ```
    """
    logger.info(f"Shaft design request: {request.requirements}")

    try:
        # Call Primary Design Agent
        result = await primary_design_agent.design_shaft(
            user_requirements=request.requirements,
            context=request.context
        )

        logger.info(
            f"Design completed: {result['converged']} after {result['totalIterations']} iterations"
        )

        return ShaftDesignResponse(
            success=True,
            design=result.get("design"),
            analysis=result.get("analysis"),
            requirements=result.get("requirements"),
            summary=result.get("summary"),
            iterations=result.get("iterations"),
            converged=result.get("converged", False),
            total_iterations=result.get("totalIterations", 0),
            message="Design completed successfully" if result.get("converged") else "Design did not fully converge"
        )

    except Exception as e:
        logger.error(f"Shaft design failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Design generation failed: {str(e)}"
        )


@router.get("/shaft/examples")
async def get_design_examples():
    """
    Get example shaft design requests for reference.

    Returns a list of example natural language prompts that work well
    with the AI design system.
    """
    examples = [
        {
            "requirements": "Design a pump shaft for 100 HP at 3600 RPM with 2 inch impeller overhang",
            "expected_output": "2.5\" diameter AISI 4140 shaft, 27\" total length"
        },
        {
            "requirements": "50 HP motor shaft running at 1800 RPM, bearing span 16 inches",
            "expected_output": "2.0\" diameter AISI 4140 shaft with bearing seats"
        },
        {
            "requirements": "Design a high-speed shaft for 25 HP at 10000 RPM, 1 inch overhang, stainless steel",
            "expected_output": "1.5\" diameter 316 SS shaft optimized for high speed"
        },
        {
            "requirements": "Heavy duty shaft for 250 HP at 900 RPM, 4 inch overhang",
            "expected_output": "4.0\" diameter 4340 steel shaft with high strength"
        },
        {
            "requirements": "Small fan shaft, 5 HP, 3600 RPM",
            "expected_output": "1.0\" diameter shaft with minimal features"
        },
    ]

    return {
        "success": True,
        "examples": examples,
        "instructions": (
            "Provide power (HP), speed (RPM), and overhang distance (inches). "
            "Optionally specify material, bearing span, or application type. "
            "The AI will parse your natural language and generate a complete design."
        )
    }


@router.get("/shaft/materials")
async def get_available_materials():
    """
    Get list of available shaft materials.

    Returns material designations, properties, and typical applications.
    """
    from app.mcp.client import mcp_client

    try:
        materials = await mcp_client.get_materials()

        return {
            "success": True,
            "materials": materials,
            "count": len(materials)
        }

    except Exception as e:
        logger.error(f"Failed to fetch materials: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch materials: {str(e)}"
        )


@router.post("/shaft/analyze")
async def analyze_existing_shaft(
    diameter: float = Field(..., description="Shaft diameter (inches)"),
    length: float = Field(..., description="Shaft length (inches)"),
    material: str = Field(default="AISI 4140", description="Material designation"),
    power: float = Field(..., description="Transmitted power (HP)"),
    speed: float = Field(..., description="Operating speed (RPM)"),
    overhang: float = Field(default=2.0, description="Overhang distance (inches)")
):
    """
    Analyze an existing shaft design.

    Validates deflection, critical speed, and stress for a given shaft.
    Use this to check if an existing design meets requirements.

    **Example:**
    ```
    POST /design/shaft/analyze
    {
      "diameter": 2.5,
      "length": 24,
      "material": "AISI 4140",
      "power": 100,
      "speed": 3600,
      "overhang": 2
    }
    ```
    """
    from app.agents.analysis_agent import analysis_agent

    logger.info(f"Analyzing shaft: {diameter}\" diameter, {material}")

    try:
        design = {
            "diameter": diameter,
            "length": length,
            "material": material,
        }

        requirements = {
            "power": power,
            "speed": speed,
            "overhang": overhang,
            "bearingSpan": length,
        }

        analysis = await analysis_agent.analyze_design(design, requirements)

        return {
            "success": True,
            "analysis": analysis,
            "passed": analysis["passed"],
            "recommendations": analysis["recommendations"]
        }

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
