"""
Analysis Agent

Performs engineering calculations and validates designs against
deflection, critical speed, and stress criteria.

This agent calls the Engineering Calculations MCP Server to run
real mechanical engineering analyses.
"""

import logging
from typing import Dict, Any, Optional
from app.mcp.client import mcp_client

logger = logging.getLogger(__name__)


class AnalysisAgent:
    """
    Specialized agent for engineering analysis.

    Responsibilities:
    - Calculate shaft deflection
    - Validate critical speed
    - Analyze stress levels
    - Check safety factors
    - Provide design recommendations
    """

    def __init__(self):
        """Initialize Analysis Agent"""
        self.client = mcp_client
        logger.info("Analysis Agent initialized")

    async def analyze_design(
        self,
        design: Dict[str, Any],
        requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze a shaft design and validate against requirements.

        Args:
            design: Shaft geometry (diameter, length, material)
            requirements: Design requirements (power, speed, etc.)

        Returns:
            Analysis results with pass/fail status and recommendations

        Example:
            >>> agent = AnalysisAgent()
            >>> design = {"diameter": 2.5, "length": 24, "material": "AISI 4140"}
            >>> reqs = {"power": 100, "speed": 3600, "overhang": 2}
            >>> result = await agent.analyze_design(design, reqs)
            >>> print(result["passed"])
            True
        """
        logger.info(f"Analyzing design: {design['diameter']}" diameter shaft")

        # Extract parameters
        diameter = design.get("diameter")
        length = design.get("length", requirements.get("bearingSpan", 20))
        material = design.get("material", "AISI 4140")

        power = requirements.get("power")
        speed = requirements.get("speed")
        overhang = requirements.get("overhang", 2)

        # Calculate torque and loads
        torque = (power * 5252 / speed) * 12  # lb-in
        radial_load = 2.5 * (power ** 0.5)  # Empirical for pumps
        bending_moment = radial_load * overhang

        results = {
            "deflection": None,
            "critical_speed": None,
            "stress": None,
            "passed": False,
            "recommendations": [],
        }

        # =====================================================================
        # 1. Deflection Analysis
        # =====================================================================

        try:
            deflection_result = await self.client.calculate_shaft_deflection(
                diameter=diameter,
                length=length,
                load=radial_load,
                position=overhang,
                material=material,
                support_type="cantilevered",
                include_self_weight=True
            )

            results["deflection"] = deflection_result

            if not deflection_result["passed"]:
                results["recommendations"].append(
                    f"Deflection {deflection_result['deflection']:.4f}\" exceeds "
                    f"allowable {deflection_result['allowable']:.4f}\". "
                    f"Increase diameter or reduce overhang."
                )

            logger.info(
                f"Deflection: {deflection_result['deflection']:.4f}\" "
                f"({'PASS' if deflection_result['passed'] else 'FAIL'})"
            )

        except Exception as e:
            logger.error(f"Deflection calculation failed: {e}")
            results["recommendations"].append(f"Deflection calculation error: {e}")

        # =====================================================================
        # 2. Critical Speed Analysis
        # =====================================================================

        try:
            critical_speed_result = await self.client.calculate_critical_speed(
                diameter=diameter,
                length=length,
                material=material,
                support_type="simply-supported",
                operating_speed=speed,
                overhang_mass=radial_load / 386.4,  # Convert to mass
                overhang_distance=overhang
            )

            results["critical_speed"] = critical_speed_result

            if not critical_speed_result.get("passed", True):
                margin = critical_speed_result.get("marginPercent", 0)
                results["recommendations"].append(
                    f"Critical speed margin ({margin:.1f}%) below required 30%. "
                    f"Increase diameter or reduce bearing span."
                )

            logger.info(
                f"Critical Speed: {critical_speed_result['firstCriticalSpeed']} RPM "
                f"({'PASS' if critical_speed_result.get('passed', True) else 'FAIL'})"
            )

        except Exception as e:
            logger.error(f"Critical speed calculation failed: {e}")
            results["recommendations"].append(f"Critical speed calculation error: {e}")

        # =====================================================================
        # 3. Stress Analysis
        # =====================================================================

        try:
            stress_result = await self.client.calculate_shaft_stress(
                diameter=diameter,
                torque=torque,
                bending_moment=bending_moment,
                material=material,
                axial_load=0
            )

            results["stress"] = stress_result

            if not stress_result["passed"]:
                sf = stress_result["safetyFactor"]
                results["recommendations"].append(
                    f"Safety factor {sf:.2f} below required {stress_result['requiredSF']:.1f}. "
                    f"Increase diameter or use higher strength material."
                )

            logger.info(
                f"von Mises Stress: {stress_result['vonMisesStress']:.0f} psi "
                f"(SF={stress_result['safetyFactor']:.2f}, "
                f"{'PASS' if stress_result['passed'] else 'FAIL'})"
            )

        except Exception as e:
            logger.error(f"Stress calculation failed: {e}")
            results["recommendations"].append(f"Stress calculation error: {e}")

        # =====================================================================
        # Overall Assessment
        # =====================================================================

        all_passed = (
            results["deflection"] and results["deflection"]["passed"] and
            results["critical_speed"] and results["critical_speed"].get("passed", True) and
            results["stress"] and results["stress"]["passed"]
        )

        results["passed"] = all_passed

        if all_passed:
            results["recommendations"].append(
                "Design meets all criteria (deflection, critical speed, stress)"
            )
        else:
            results["recommendations"].insert(
                0,
                "Design does not meet all criteria - see specific recommendations below"
            )

        logger.info(f"Overall analysis: {'PASSED' if all_passed else 'FAILED'}")

        return results

    async def suggest_diameter_increase(
        self,
        current_diameter: float,
        failure_type: str
    ) -> float:
        """
        Suggest increased diameter based on failure type.

        Args:
            current_diameter: Current diameter (inches)
            failure_type: 'deflection', 'critical_speed', or 'stress'

        Returns:
            Suggested new diameter (inches)
        """
        # Conservative increases based on failure type
        increase_factors = {
            "deflection": 1.15,  # 15% increase
            "critical_speed": 1.20,  # 20% increase
            "stress": 1.10,  # 10% increase
        }

        factor = increase_factors.get(failure_type, 1.15)
        new_diameter = current_diameter * factor

        # Round up to nearest 1/8"
        new_diameter = (int(new_diameter * 8) + 1) / 8

        logger.info(
            f"Suggesting diameter increase: {current_diameter}\" → {new_diameter}\" "
            f"(due to {failure_type})"
        )

        return new_diameter


# Global instance
analysis_agent = AnalysisAgent()
