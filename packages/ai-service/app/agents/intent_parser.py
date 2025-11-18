"""
Intent Parser Agent for Natural Language CAD Commands.

This module uses Claude API to parse user commands into structured
CAD operations with parameters and confidence scores.
"""

import logging
from typing import Dict, Any, Optional
from anthropic import Anthropic, APIError, APITimeoutError
from pydantic import BaseModel, Field, ValidationError

from app.config import settings
from app.knowledge.knowledge_base import search_knowledge

logger = logging.getLogger(__name__)


# Response schema for parsed commands
class ParsedCommand(BaseModel):
    """Structured CAD command parsed from natural language."""

    operation: str = Field(
        ...,
        description="Type of operation: create, modify, delete, measure, analyze",
    )
    geometry: str = Field(
        ...,
        description="Geometry type: box, cylinder, sphere, hole, fillet, chamfer, extrude",
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Operation parameters including dimensions and location",
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0"
    )
    reasoning: Optional[str] = Field(
        None, description="Explanation of how the command was interpreted"
    )
    suggestions: Optional[list[str]] = Field(
        None, description="Suggestions for ambiguous or incomplete commands"
    )


class IntentParserAgent:
    """
    Agent for parsing natural language CAD commands using Claude API.

    This agent:
    1. Takes natural language input (e.g., "Create a 50mm cube")
    2. Uses Claude to parse it into structured JSON
    3. Enriches with knowledge base context
    4. Returns operation type, geometry, parameters, and confidence
    """

    def __init__(self):
        """Initialize the Intent Parser Agent."""
        if not settings.anthropic_api_key:
            logger.warning(
                "Anthropic API key not configured - agent will use fallback parsing"
            )
            self.client = None
        else:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
        logger.info("Intent Parser Agent initialized")

    def parse_command(
        self, user_input: str, context: Optional[Dict[str, Any]] = None
    ) -> ParsedCommand:
        """
        Parse natural language command into structured CAD operation.

        Args:
            user_input: Natural language command from user
            context: Optional context (current project, selection, etc.)

        Returns:
            ParsedCommand with operation details and confidence score

        Example:
            >>> agent = IntentParserAgent()
            >>> result = agent.parse_command("Create a 50mm cube")
            >>> print(result.operation)  # "create"
            >>> print(result.geometry)   # "box"
            >>> print(result.parameters) # {"width": 50, "height": 50, "depth": 50}
        """
        try:
            # Use Claude API if available, otherwise fallback
            if self.client:
                return self._parse_with_claude(user_input, context or {})
            else:
                return self._parse_with_fallback(user_input)

        except Exception as e:
            logger.error(f"Error parsing command: {e}")
            # Return a low-confidence error response
            return ParsedCommand(
                operation="unknown",
                geometry="unknown",
                parameters={"error": str(e)},
                confidence=0.0,
                reasoning=f"Failed to parse command: {str(e)}",
                suggestions=[
                    "Try rephrasing your command",
                    "Example: 'Create a box 10mm x 20mm x 30mm'",
                ],
            )

    def _parse_with_claude(
        self, user_input: str, context: Dict[str, Any]
    ) -> ParsedCommand:
        """Parse command using Claude API."""
        # Search knowledge base for relevant context
        knowledge_context = self._get_knowledge_context(user_input)

        # Build system prompt
        system_prompt = self._build_system_prompt(knowledge_context)

        # Build user message with context
        user_message = self._build_user_message(user_input, context)

        try:
            # Call Claude API
            response = self.client.messages.create(
                model=settings.claude_model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                temperature=0.3,  # Lower temperature for more consistent parsing
            )

            # Extract response text
            response_text = response.content[0].text

            # Parse JSON response
            import json

            parsed_json = json.loads(response_text)

            # Validate and create ParsedCommand
            return ParsedCommand(**parsed_json)

        except APITimeoutError:
            logger.error("Claude API timeout")
            return self._parse_with_fallback(user_input, error="API timeout")

        except APIError as e:
            logger.error(f"Claude API error: {e}")
            return self._parse_with_fallback(user_input, error=f"API error: {e}")

        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Failed to parse Claude response: {e}")
            return self._parse_with_fallback(
                user_input, error=f"Invalid response format: {e}"
            )

    def _parse_with_fallback(
        self, user_input: str, error: Optional[str] = None
    ) -> ParsedCommand:
        """Simple fallback parser using keyword matching."""
        user_lower = user_input.lower()

        # Detect operation
        operation = "create"
        if any(word in user_lower for word in ["delete", "remove"]):
            operation = "delete"
        elif any(word in user_lower for word in ["modify", "change", "edit", "update"]):
            operation = "modify"
        elif any(word in user_lower for word in ["measure", "dimension"]):
            operation = "measure"

        # Detect geometry
        geometry = "box"
        if any(word in user_lower for word in ["cylinder", "tube", "pipe"]):
            geometry = "cylinder"
        elif any(word in user_lower for word in ["sphere", "ball"]):
            geometry = "sphere"
        elif any(word in user_lower for word in ["hole", "drill"]):
            geometry = "hole"
        elif any(word in user_lower for word in ["fillet", "round"]):
            geometry = "fillet"
        elif any(word in user_lower for word in ["chamfer", "bevel"]):
            geometry = "chamfer"
        elif any(word in user_lower for word in ["extrude", "extend"]):
            geometry = "extrude"
        elif any(word in user_lower for word in ["cube"]):
            geometry = "box"

        # Extract basic dimensions
        import re

        numbers = re.findall(r"\d+\.?\d*", user_input)
        parameters = {}

        if numbers:
            if geometry == "box":
                if "cube" in user_lower or len(numbers) == 1:
                    size = float(numbers[0])
                    parameters = {"width": size, "height": size, "depth": size}
                elif len(numbers) >= 3:
                    parameters = {
                        "width": float(numbers[0]),
                        "height": float(numbers[1]),
                        "depth": float(numbers[2]),
                    }
            elif geometry == "cylinder":
                if len(numbers) >= 2:
                    parameters = {"radius": float(numbers[0]), "height": float(numbers[1])}
            elif geometry == "sphere":
                if len(numbers) >= 1:
                    parameters = {"radius": float(numbers[0])}

        confidence = 0.5 if not error else 0.3
        reasoning = (
            error or "Parsed using simple keyword matching - consider providing more specific details"
        )

        return ParsedCommand(
            operation=operation,
            geometry=geometry,
            parameters=parameters,
            confidence=confidence,
            reasoning=reasoning,
            suggestions=[
                "Use Claude API for more accurate parsing",
                "Provide dimensions with units (e.g., '50mm')",
                "Specify exact operation (create, modify, delete)",
            ],
        )

    def _get_knowledge_context(self, user_input: str) -> list[Dict[str, Any]]:
        """Search knowledge base for relevant context."""
        try:
            # Search for motor references
            motors = search_knowledge(user_input, category="motors")

            # Search for fastener references
            fasteners = search_knowledge(user_input, category="fasteners")

            # Search for material references
            materials = search_knowledge(user_input, category="materials")

            # Combine results
            all_results = motors + fasteners + materials

            # Return top 3 most relevant
            return all_results[:3] if all_results else []

        except Exception as e:
            logger.warning(f"Failed to get knowledge context: {e}")
            return []

    def _build_system_prompt(self, knowledge_context: list[Dict[str, Any]]) -> str:
        """Build system prompt for Claude."""
        prompt = """You are a CAD command parser for an autonomous CAD engineering system.

Your task is to convert natural language commands into structured JSON that describes CAD operations.

**Output Format:**
Return ONLY valid JSON (no markdown, no explanations) in this exact format:
{
  "operation": "<create|modify|delete|measure|analyze>",
  "geometry": "<box|cylinder|sphere|hole|fillet|chamfer|extrude|cut>",
  "parameters": {
    "dimensions": {...},
    "position": {...},
    "other_params": ...
  },
  "confidence": <0.0-1.0>,
  "reasoning": "Brief explanation of interpretation",
  "suggestions": ["Optional suggestions if command is ambiguous"]
}

**Operation Types:**
- create: Make new geometry
- modify: Change existing geometry
- delete: Remove geometry
- measure: Get dimensions
- analyze: Analyze properties

**Geometry Types:**
- box: Rectangular prism (requires width, height, depth)
- cylinder: Cylindrical shape (requires radius, height)
- sphere: Spherical shape (requires radius)
- hole: Cylindrical hole (requires radius, depth)
- fillet: Rounded edge (requires radius, edge_ids)
- chamfer: Beveled edge (requires distance, angle, edge_ids)
- extrude: Extrude 2D sketch (requires distance, direction)
- cut: Cut/subtract (requires sketch_id, depth)

**Parameter Guidelines:**
- Default units: millimeters (mm)
- Convert inches to mm if specified (1 inch = 25.4mm)
- Position defaults to origin {x: 0, y: 0, z: 0}
- Use standard engineering conventions

**Confidence Scoring:**
- 0.9-1.0: Very clear, all parameters specified
- 0.7-0.8: Clear but missing some details
- 0.5-0.6: Ambiguous, made assumptions
- 0.0-0.4: Very unclear, low confidence
"""

        # Add knowledge context if available
        if knowledge_context:
            prompt += "\n\n**Engineering Knowledge Context:**\n"
            for item in knowledge_context:
                prompt += f"\n{item['category']}/{item['name']}:\n"
                prompt += f"{item['data']}\n"

        prompt += """
**Examples:**

Input: "Create a 50mm cube"
Output: {
  "operation": "create",
  "geometry": "box",
  "parameters": {
    "width": 50,
    "height": 50,
    "depth": 50,
    "position": {"x": 0, "y": 0, "z": 0}
  },
  "confidence": 0.95,
  "reasoning": "Clear cube creation with all dimensions specified"
}

Input: "Make a NEMA 23 motor mount"
Output: {
  "operation": "create",
  "geometry": "box",
  "parameters": {
    "width": 60,
    "height": 60,
    "depth": 10,
    "mounting_holes": {
      "pattern": "square",
      "spacing": 47.14,
      "diameter": 5.2
    }
  },
  "confidence": 0.85,
  "reasoning": "Motor mount for NEMA 23 with standard dimensions from knowledge base"
}

Input: "Drill a hole"
Output: {
  "operation": "create",
  "geometry": "hole",
  "parameters": {},
  "confidence": 0.4,
  "reasoning": "Missing hole diameter and depth",
  "suggestions": [
    "Specify hole diameter (e.g., '5mm diameter')",
    "Specify hole depth (e.g., '10mm deep')"
  ]
}

Remember: Return ONLY the JSON object, no other text.
"""

        return prompt

    def _build_user_message(
        self, user_input: str, context: Dict[str, Any]
    ) -> str:
        """Build user message with context."""
        message = f"Command: {user_input}"

        if context:
            message += f"\n\nContext: {context}"

        return message


# Global instance
intent_parser = IntentParserAgent()


def parse_command(
    user_input: str, context: Optional[Dict[str, Any]] = None
) -> ParsedCommand:
    """
    Convenience function to parse commands using the global intent parser.

    Args:
        user_input: Natural language command
        context: Optional context dictionary

    Returns:
        ParsedCommand with structured operation details

    Example:
        >>> result = parse_command("Create a box 10x20x30mm")
        >>> print(result.operation)  # "create"
        >>> print(result.parameters)  # {"width": 10, "height": 20, "depth": 30}
    """
    return intent_parser.parse_command(user_input, context)
