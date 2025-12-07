"""
Primary Design Agent

Orchestrates the entire mechanical design process by coordinating
specialized agents (Analysis, Geometry, Materials, etc.).

Uses Claude AI to reason about design decisions and iterate
until all engineering requirements are met.
"""

import logging
from typing import Dict, Any, Optional, List
from anthropic import Anthropic
from app.config import settings
from app.mcp.client import mcp_client
from app.agents.analysis_agent import analysis_agent

logger = logging.getLogger(__name__)


class PrimaryDesignAgent:
    """
    Primary orchestrating agent for mechanical design.

    This agent:
    1. Parses user requirements using Claude
    2. Generates initial design using MCP servers
    3. Coordinates specialized agents for validation
    4. Iterates design until all criteria met
    5. Returns final design with full documentation
    """

    def __init__(self):
        """Initialize Primary Design Agent"""
        if settings.anthropic_api_key:
            self.claude = Anthropic(api_key=settings.anthropic_api_key)
        else:
            self.claude = None
            logger.warning("Claude API not configured - using simplified logic")

        self.mcp = mcp_client
        logger.info("Primary Design Agent initialized")

    async def design_shaft(
        self,
        user_requirements: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Design a complete shaft from natural language requirements.

        Args:
            user_requirements: Natural language description
                Example: "Design a pump shaft for 100 HP at 3600 RPM with 2\" overhang"
            context: Optional additional context

        Returns:
            Complete design package including:
            - geometry: Shaft design with features
            - analysis: Deflection, critical speed, stress
            - iterations: Design history
            - reasoning: AI explanation of design decisions

        Example:
            >>> agent = PrimaryDesignAgent()
            >>> result = await agent.design_shaft(
            ...     "Design a pump shaft for 100 HP at 3600 RPM, 2 inch overhang"
            ... )
            >>> print(result["summary"]["passed"])
            True
        """
        logger.info(f"Starting shaft design: {user_requirements}")

        # Step 1: Parse requirements
        requirements = await self._parse_requirements(user_requirements)
        logger.info(f"Parsed requirements: {requirements}")

        # Step 2: Generate initial design
        iteration = 0
        max_iterations = 5
        design_history = []

        current_design = await self._generate_initial_design(requirements)
        design_history.append({
            "iteration": 0,
            "design": current_design,
            "reasoning": "Initial design generated from requirements",
        })

        # Step 3: Iterative refinement
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"Design iteration {iteration}")

            # Analyze current design
            analysis = await analysis_agent.analyze_design(
                design=current_design,
                requirements=requirements
            )

            design_history.append({
                "iteration": iteration,
                "analysis": analysis,
            })

            # Check if design passes all criteria
            if analysis["passed"]:
                logger.info(f"Design converged after {iteration} iterations")
                break

            # If not, refine design
            current_design = await self._refine_design(
                current_design=current_design,
                analysis=analysis,
                requirements=requirements,
                iteration=iteration
            )

            design_history.append({
                "iteration": iteration,
                "refined_design": current_design,
                "reasoning": "Design refined based on analysis feedback",
            })

        # Step 4: Generate final analysis
        final_analysis = await analysis_agent.analyze_design(
            design=current_design,
            requirements=requirements
        )

        # Step 5: Generate design summary with Claude
        summary = await self._generate_summary(
            design=current_design,
            analysis=final_analysis,
            requirements=requirements,
            iterations=iteration
        )

        return {
            "design": current_design,
            "analysis": final_analysis,
            "requirements": requirements,
            "iterations": design_history,
            "summary": summary,
            "converged": final_analysis["passed"],
            "totalIterations": iteration,
        }

    async def _parse_requirements(
        self,
        user_input: str
    ) -> Dict[str, Any]:
        """
        Parse natural language requirements into structured format.

        Uses Claude if available, otherwise uses simple pattern matching.
        """
        if self.claude:
            return await self._parse_with_claude(user_input)
        else:
            return self._parse_simple(user_input)

    async def _parse_with_claude(self, user_input: str) -> Dict[str, Any]:
        """Parse requirements using Claude AI"""
        system_prompt = """You are a mechanical engineering assistant.
Extract shaft design parameters from natural language.

Return ONLY valid JSON in this format:
{
  "power": <number in HP>,
  "speed": <number in RPM>,
  "overhang": <number in inches>,
  "bearingSpan": <number in inches>,
  "material": "<material designation>",
  "application": "<pump|motor|fan|etc>"
}

If a parameter is not specified, use typical defaults:
- bearingSpan: 20 inches (typical for pump shafts)
- material: "AISI 4140" (common shaft material)
- overhang: 2 inches (if not specified)

Examples:
Input: "100 HP pump at 3600 RPM with 2 inch impeller overhang"
Output: {"power": 100, "speed": 3600, "overhang": 2, "bearingSpan": 20, "material": "AISI 4140", "application": "pump"}

Input: "50 HP motor shaft, 1800 RPM"
Output: {"power": 50, "speed": 1800, "overhang": 1, "bearingSpan": 16, "material": "AISI 4140", "application": "motor"}
"""

        try:
            response = self.claude.messages.create(
                model=settings.claude_model,
                max_tokens=512,
                temperature=0.2,
                system=system_prompt,
                messages=[{"role": "user", "content": user_input}]
            )

            import json
            requirements = json.loads(response.content[0].text)
            logger.info(f"Claude parsed requirements: {requirements}")
            return requirements

        except Exception as e:
            logger.error(f"Claude parsing failed: {e}, falling back to simple parsing")
            return self._parse_simple(user_input)

    def _parse_simple(self, user_input: str) -> Dict[str, Any]:
        """Simple pattern-based parsing (fallback)"""
        import re

        requirements = {
            "bearingSpan": 20,  # Default
            "material": "AISI 4140",  # Default
            "application": "pump",  # Default
        }

        # Extract power
        power_match = re.search(r"(\d+\.?\d*)\s*HP", user_input, re.IGNORECASE)
        if power_match:
            requirements["power"] = float(power_match.group(1))

        # Extract speed
        speed_match = re.search(r"(\d+)\s*RPM", user_input, re.IGNORECASE)
        if speed_match:
            requirements["speed"] = int(speed_match.group(1))

        # Extract overhang
        overhang_match = re.search(r"(\d+\.?\d*)\s*(?:inch|in|\")\s*overhang", user_input, re.IGNORECASE)
        if overhang_match:
            requirements["overhang"] = float(overhang_match.group(1))
        else:
            requirements["overhang"] = 2  # Default

        logger.info(f"Simple parsing extracted: {requirements}")
        return requirements

    async def _generate_initial_design(
        self,
        requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate initial shaft design using MCP geometry generator.

        This calls the Engineering Calculations Server which automatically
        sizes the shaft to meet all criteria.
        """
        logger.info("Generating initial shaft geometry")

        try:
            geometry = await self.mcp.generate_shaft_geometry(
                power=requirements["power"],
                speed=requirements["speed"],
                overhang=requirements.get("overhang", 2),
                bearing_span=requirements.get("bearingSpan", 20),
                material=requirements.get("material", "AISI 4140")
            )

            logger.info(f"Generated shaft: {geometry['diameter']}\" diameter, {geometry['length']}\" long")

            return {
                "diameter": geometry["diameter"],
                "length": geometry["length"],
                "material": geometry["material"],
                "features": geometry["features"],
                "torque": geometry["torque"],
                "radialLoad": geometry["radialLoad"],
                "bendingMoment": geometry["bendingMoment"],
            }

        except Exception as e:
            logger.error(f"Initial design generation failed: {e}")
            # Fallback to conservative estimate
            return {
                "diameter": 2.5,  # Conservative starting point
                "length": requirements.get("bearingSpan", 20) + requirements.get("overhang", 2) + 5,
                "material": requirements.get("material", "AISI 4140"),
                "features": [],
                "torque": (requirements["power"] * 5252 / requirements["speed"]) * 12,
                "radialLoad": 2.5 * (requirements["power"] ** 0.5),
                "bendingMoment": 2.5 * (requirements["power"] ** 0.5) * requirements.get("overhang", 2),
            }

    async def _refine_design(
        self,
        current_design: Dict[str, Any],
        analysis: Dict[str, Any],
        requirements: Dict[str, Any],
        iteration: int
    ) -> Dict[str, Any]:
        """
        Refine design based on analysis feedback.

        Uses intelligent rules to modify diameter, material, or geometry.
        """
        logger.info("Refining design based on analysis feedback")

        refined = current_design.copy()

        # Determine what needs to be fixed
        deflection_failed = analysis.get("deflection") and not analysis["deflection"]["passed"]
        critical_speed_failed = analysis.get("critical_speed") and not analysis["critical_speed"].get("passed", True)
        stress_failed = analysis.get("stress") and not analysis["stress"]["passed"]

        # Strategy: Increase diameter (most effective solution)
        if deflection_failed or critical_speed_failed or stress_failed:
            # Determine required increase based on severity
            if stress_failed:
                # Stress failure: 10% increase
                increase_factor = 1.10
            elif deflection_failed:
                # Deflection failure: 15% increase
                increase_factor = 1.15
            else:
                # Critical speed failure: 20% increase
                increase_factor = 1.20

            new_diameter = current_design["diameter"] * increase_factor

            # Round up to nearest 1/8"
            new_diameter = (int(new_diameter * 8) + 1) / 8

            # Max practical diameter (manufacturing limit)
            if new_diameter > 6.0:
                logger.warning(f"Diameter {new_diameter}\" exceeds practical limit, capping at 6\"")
                new_diameter = 6.0

            refined["diameter"] = new_diameter

            logger.info(
                f"Increased diameter: {current_design['diameter']:.3f}\" → {new_diameter:.3f}\""
            )

        return refined

    async def _generate_summary(
        self,
        design: Dict[str, Any],
        analysis: Dict[str, Any],
        requirements: Dict[str, Any],
        iterations: int
    ) -> Dict[str, Any]:
        """
        Generate human-readable summary of design process.

        Uses Claude if available for natural language explanation.
        """
        summary = {
            "passed": analysis["passed"],
            "diameter": design["diameter"],
            "material": design["material"],
            "iterations": iterations,
            "key_results": {},
        }

        # Extract key results
        if analysis.get("deflection"):
            summary["key_results"]["deflection"] = {
                "value": analysis["deflection"]["deflection"],
                "unit": "inches",
                "limit": analysis["deflection"]["allowable"],
                "passed": analysis["deflection"]["passed"],
            }

        if analysis.get("critical_speed"):
            summary["key_results"]["critical_speed"] = {
                "value": analysis["critical_speed"]["firstCriticalSpeed"],
                "unit": "RPM",
                "operating_speed": requirements["speed"],
                "margin": analysis["critical_speed"].get("marginPercent", 0),
                "passed": analysis["critical_speed"].get("passed", True),
            }

        if analysis.get("stress"):
            summary["key_results"]["stress"] = {
                "von_mises": analysis["stress"]["vonMisesStress"],
                "unit": "psi",
                "safety_factor": analysis["stress"]["safetyFactor"],
                "required_sf": analysis["stress"]["requiredSF"],
                "passed": analysis["stress"]["passed"],
            }

        # Generate narrative (Claude or simple)
        if self.claude and analysis["passed"]:
            try:
                narrative = await self._generate_claude_narrative(
                    design, analysis, requirements, iterations
                )
                summary["narrative"] = narrative
            except Exception as e:
                logger.error(f"Narrative generation failed: {e}")
                summary["narrative"] = self._generate_simple_narrative(summary)
        else:
            summary["narrative"] = self._generate_simple_narrative(summary)

        return summary

    async def _generate_claude_narrative(
        self,
        design: Dict[str, Any],
        analysis: Dict[str, Any],
        requirements: Dict[str, Any],
        iterations: int
    ) -> str:
        """Generate natural language summary using Claude"""
        prompt = f"""Summarize this shaft design in 2-3 professional engineering sentences.

Requirements:
- Power: {requirements['power']} HP
- Speed: {requirements['speed']} RPM
- Overhang: {requirements.get('overhang', 2)} inches

Final Design:
- Diameter: {design['diameter']} inches
- Material: {design['material']}
- Iterations: {iterations}

Analysis Results:
- Deflection: {analysis['deflection']['deflection']:.4f}" (limit: {analysis['deflection']['allowable']}")
- Critical Speed: {analysis['critical_speed']['firstCriticalSpeed']} RPM ({analysis['critical_speed'].get('marginPercent', 0):.1f}% margin)
- von Mises Stress: {analysis['stress']['vonMisesStress']:.0f} psi (SF={analysis['stress']['safetyFactor']:.2f})
- All Criteria: {'PASSED' if analysis['passed'] else 'FAILED'}

Write a concise engineering summary."""

        response = self.claude.messages.create(
            model=settings.claude_model,
            max_tokens=256,
            temperature=0.5,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def _generate_simple_narrative(self, summary: Dict[str, Any]) -> str:
        """Generate simple narrative (fallback)"""
        if summary["passed"]:
            return (
                f"Design converged successfully after {summary['iterations']} iterations. "
                f"Final shaft diameter: {summary['diameter']:.3f}\" ({summary['material']}). "
                f"All engineering criteria met (deflection, critical speed, stress)."
            )
        else:
            return (
                f"Design did not fully converge after {summary['iterations']} iterations. "
                f"Current shaft diameter: {summary['diameter']:.3f}\" ({summary['material']}). "
                f"Some engineering criteria not met - review recommendations."
            )


# Global instance
primary_design_agent = PrimaryDesignAgent()
