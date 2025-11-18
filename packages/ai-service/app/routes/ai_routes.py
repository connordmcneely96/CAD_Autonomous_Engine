"""
AI API Routes for Natural Language CAD Commands.

This module provides REST API endpoints for processing natural language
CAD commands using the Intent Parser Agent.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.agents.intent_parser import parse_command, ParsedCommand

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ai", tags=["AI"])


# Request/Response Models
class CommandRequest(BaseModel):
    """Request body for natural language command processing."""

    command: str = Field(
        ..., min_length=1, max_length=1000, description="Natural language CAD command"
    )
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional context (current project, selection, etc.)",
        example={
            "project_id": "proj-123",
            "selected_features": ["box-1", "cylinder-2"],
            "current_sketch": "sketch-1",
        },
    )


class CommandResponse(BaseModel):
    """Response for processed command."""

    success: bool = Field(..., description="Whether command was parsed successfully")
    parsed_command: ParsedCommand = Field(..., description="Structured parsed command")
    message: Optional[str] = Field(
        None, description="Additional message or error details"
    )


class KnowledgeSearchRequest(BaseModel):
    """Request body for knowledge base search."""

    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    category: Optional[str] = Field(
        None,
        description="Optional category filter",
        example="motors",
    )


class ExampleCommand(BaseModel):
    """Example command for documentation."""

    command: str
    description: str
    expected_operation: str
    expected_geometry: str


# Routes
@router.post(
    "/command",
    response_model=CommandResponse,
    status_code=status.HTTP_200_OK,
    summary="Process Natural Language CAD Command",
    description="""
Process a natural language CAD command and return structured operation.

The AI agent will:
1. Parse the command using Claude API (or fallback parser)
2. Extract operation type, geometry, and parameters
3. Enrich with knowledge base context
4. Return structured JSON with confidence score

**Examples:**
- "Create a 50mm cube"
- "Make a box 10x20x30mm at position 5,5,0"
- "Drill a 5mm hole, 10mm deep"
- "Add a 2mm fillet to edges 1, 2, 3"
- "Create a NEMA 23 motor mount"
""",
)
async def process_command(request: CommandRequest) -> CommandResponse:
    """
    Process a natural language CAD command.

    Args:
        request: Command request with user input and optional context

    Returns:
        CommandResponse with parsed command structure

    Raises:
        HTTPException: If command processing fails catastrophically
    """
    try:
        logger.info(f"Processing command: {request.command}")

        # Parse the command using the intent parser agent
        parsed = parse_command(request.command, request.context)

        # Check if parsing was successful (confidence > 0.3)
        success = parsed.confidence > 0.3

        # Build response message
        message = None
        if not success:
            message = "Command parsing failed - confidence too low. Please rephrase your command."
        elif parsed.confidence < 0.6:
            message = "Command parsed with low confidence - please verify parameters."
        elif parsed.suggestions:
            message = "Command parsed successfully with some suggestions for improvement."

        logger.info(
            f"Command parsed: operation={parsed.operation}, "
            f"geometry={parsed.geometry}, confidence={parsed.confidence}"
        )

        return CommandResponse(
            success=success,
            parsed_command=parsed,
            message=message,
        )

    except Exception as e:
        logger.error(f"Error processing command: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process command: {str(e)}",
        )


@router.get(
    "/examples",
    response_model=list[ExampleCommand],
    summary="Get Example Commands",
    description="Get a list of example natural language commands for reference.",
)
async def get_examples() -> list[ExampleCommand]:
    """
    Get example commands for documentation and testing.

    Returns:
        List of example commands with expected results
    """
    return [
        ExampleCommand(
            command="Create a 50mm cube",
            description="Create a cubic box with all sides 50mm",
            expected_operation="create",
            expected_geometry="box",
        ),
        ExampleCommand(
            command="Make a box 10x20x30mm",
            description="Create a rectangular box with specific dimensions",
            expected_operation="create",
            expected_geometry="box",
        ),
        ExampleCommand(
            command="Create a cylinder radius 5mm, height 20mm",
            description="Create a cylinder with specified dimensions",
            expected_operation="create",
            expected_geometry="cylinder",
        ),
        ExampleCommand(
            command="Make a sphere with radius 10mm",
            description="Create a spherical shape",
            expected_operation="create",
            expected_geometry="sphere",
        ),
        ExampleCommand(
            command="Drill a 5mm hole, 10mm deep",
            description="Create a cylindrical hole",
            expected_operation="create",
            expected_geometry="hole",
        ),
        ExampleCommand(
            command="Add a 2mm fillet to edges 1, 2, 3",
            description="Round edges with specified radius",
            expected_operation="modify",
            expected_geometry="fillet",
        ),
        ExampleCommand(
            command="Add a 1mm chamfer at 45 degrees to edge 5",
            description="Bevel an edge",
            expected_operation="modify",
            expected_geometry="chamfer",
        ),
        ExampleCommand(
            command="Extrude sketch 1 by 15mm",
            description="Extrude a 2D sketch",
            expected_operation="create",
            expected_geometry="extrude",
        ),
        ExampleCommand(
            command="Create a NEMA 23 motor mount",
            description="Create a mount using knowledge base dimensions",
            expected_operation="create",
            expected_geometry="box",
        ),
        ExampleCommand(
            command="Delete feature 3",
            description="Remove a feature from the model",
            expected_operation="delete",
            expected_geometry="unknown",
        ),
    ]


@router.get(
    "/status",
    summary="Get AI Service Status",
    description="Check the status of the AI service and available capabilities.",
)
async def get_status():
    """
    Get AI service status and capabilities.

    Returns:
        Service status information
    """
    from app.config import settings
    from app.agents.intent_parser import intent_parser

    return {
        "status": "operational",
        "version": "0.1.0",
        "claude_available": intent_parser.client is not None,
        "claude_model": settings.claude_model if intent_parser.client else None,
        "capabilities": {
            "operations": ["create", "modify", "delete", "measure", "analyze"],
            "geometries": [
                "box",
                "cylinder",
                "sphere",
                "hole",
                "fillet",
                "chamfer",
                "extrude",
                "cut",
            ],
            "knowledge_categories": [
                "motors",
                "fasteners",
                "materials",
                "tolerances",
                "common_dimensions",
            ],
        },
        "fallback_parser": "available" if not intent_parser.client else "not_needed",
    }


@router.post(
    "/knowledge/search",
    summary="Search Knowledge Base",
    description="Search the engineering knowledge base for specifications and facts.",
)
async def search_knowledge_base(request: KnowledgeSearchRequest):
    """
    Search the knowledge base for engineering specifications.

    Args:
        request: Search request with query and optional category

    Returns:
        Search results from knowledge base
    """
    try:
        from app.knowledge.knowledge_base import search_knowledge

        results = search_knowledge(request.query, request.category)

        return {
            "success": True,
            "query": request.query,
            "category": request.category,
            "results": results,
            "count": len(results),
        }

    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge base search failed: {str(e)}",
        )
