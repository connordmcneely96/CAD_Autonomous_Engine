"""
MCP Client for calling Engineering Calculation Servers

This client provides a simple interface for AI agents to call
MCP calculation servers and get engineering analysis results.
"""

import logging
import httpx
from typing import Dict, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class MCPResponse(BaseModel):
    """Standard MCP server response format"""
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any]


class MCPClient:
    """
    Client for calling MCP calculation servers.

    Provides methods for:
    - Shaft deflection analysis
    - Critical speed calculations
    - Stress analysis
    - Complete shaft design generation
    """

    def __init__(
        self,
        engineering_calc_url: str = "http://localhost:8100",
        timeout: float = 30.0
    ):
        """
        Initialize MCP client.

        Args:
            engineering_calc_url: URL of Engineering Calculations MCP Server
            timeout: Request timeout in seconds
        """
        self.engineering_calc_url = engineering_calc_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    async def _call_endpoint(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None
    ) -> MCPResponse:
        """
        Internal method to call MCP server endpoint.

        Args:
            method: HTTP method (GET, POST)
            endpoint: API endpoint path
            data: Request body data

        Returns:
            MCPResponse with calculation results

        Raises:
            Exception: If server returns error or is unavailable
        """
        url = f"{self.engineering_calc_url}{endpoint}"

        try:
            if method == "GET":
                response = await self.client.get(url)
            elif method == "POST":
                response = await self.client.post(url, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            result = response.json()
            return MCPResponse(**result)

        except httpx.HTTPStatusError as e:
            logger.error(f"MCP server error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"MCP server returned error: {e.response.text}")

        except httpx.RequestError as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise Exception(f"Cannot connect to MCP server at {url}")

    # =========================================================================
    # Shaft Deflection
    # =========================================================================

    async def calculate_shaft_deflection(
        self,
        diameter: float,
        length: float,
        load: float,
        position: float,
        material: str = "AISI 4140",
        support_type: str = "simply-supported",
        include_self_weight: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate shaft deflection under load.

        Args:
            diameter: Shaft diameter (inches)
            length: Shaft length between supports (inches)
            load: Applied load (lbf)
            position: Load position from left support (inches)
            material: Material designation
            support_type: 'simply-supported', 'fixed-fixed', or 'cantilevered'
            include_self_weight: Include shaft self-weight in calculation

        Returns:
            Deflection analysis results

        Example:
            >>> client = MCPClient()
            >>> result = await client.calculate_shaft_deflection(
            ...     diameter=2.5,
            ...     length=24,
            ...     load=500,
            ...     position=22,
            ...     material="AISI 4140"
            ... )
            >>> print(result["deflection"])  # inches
            0.003
        """
        data = {
            "diameter": diameter,
            "length": length,
            "load": load,
            "position": position,
            "material": material,
            "supportType": support_type,
            "includeSelfWeight": include_self_weight,
        }

        response = await self._call_endpoint("POST", "/api/shaft/deflection", data)

        if not response.success:
            raise Exception(f"Deflection calculation failed: {response.error}")

        return response.result

    # =========================================================================
    # Critical Speed
    # =========================================================================

    async def calculate_critical_speed(
        self,
        diameter: float,
        length: float,
        material: str = "AISI 4140",
        support_type: str = "simply-supported",
        operating_speed: Optional[float] = None,
        overhang_mass: Optional[float] = None,
        overhang_distance: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculate first critical speed of rotating shaft.

        Args:
            diameter: Shaft diameter (inches)
            length: Shaft length between supports (inches)
            material: Material designation
            support_type: 'simply-supported' or 'fixed-fixed'
            operating_speed: Operating speed (RPM) for compliance check
            overhang_mass: Mass at overhang (lb) - optional
            overhang_distance: Distance from bearing to overhang (in) - optional

        Returns:
            Critical speed analysis with API 610 compliance check

        Example:
            >>> result = await client.calculate_critical_speed(
            ...     diameter=2.5,
            ...     length=24,
            ...     material="AISI 4140",
            ...     operating_speed=3600
            ... )
            >>> print(result["firstCriticalSpeed"])  # RPM
            4800
            >>> print(result["passed"])  # True if > 30% margin
            True
        """
        data = {
            "diameter": diameter,
            "length": length,
            "material": material,
            "supportType": support_type,
        }

        if operating_speed is not None:
            data["operatingSpeed"] = operating_speed

        if overhang_mass is not None:
            data["overhangMass"] = overhang_mass

        if overhang_distance is not None:
            data["overhangDistance"] = overhang_distance

        response = await self._call_endpoint("POST", "/api/shaft/critical-speed", data)

        if not response.success:
            raise Exception(f"Critical speed calculation failed: {response.error}")

        return response.result

    # =========================================================================
    # Shaft Stress
    # =========================================================================

    async def calculate_shaft_stress(
        self,
        diameter: float,
        torque: float,
        bending_moment: float,
        material: str = "AISI 4140",
        axial_load: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculate combined stress in shaft (bending + torsion + axial).

        Uses von Mises criterion for ductile materials.

        Args:
            diameter: Shaft diameter (inches)
            torque: Applied torque (lb-in)
            bending_moment: Bending moment (lb-in)
            material: Material designation
            axial_load: Axial load (lbf) - tension or compression

        Returns:
            Stress analysis with safety factor

        Example:
            >>> result = await client.calculate_shaft_stress(
            ...     diameter=2.5,
            ...     torque=1460,
            ...     bending_moment=1000,
            ...     material="AISI 4140"
            ... )
            >>> print(result["vonMisesStress"])  # psi
            10558
            >>> print(result["safetyFactor"])
            6.06
        """
        data = {
            "diameter": diameter,
            "torque": torque,
            "bendingMoment": bending_moment,
            "material": material,
            "axialLoad": axial_load,
        }

        response = await self._call_endpoint("POST", "/api/shaft/stress", data)

        if not response.success:
            raise Exception(f"Stress calculation failed: {response.error}")

        return response.result

    # =========================================================================
    # Shaft Geometry Generation
    # =========================================================================

    async def generate_shaft_geometry(
        self,
        power: float,
        speed: float,
        overhang: float,
        bearing_span: float,
        material: str = "AISI 4140",
        application_factor: float = 1.5
    ) -> Dict[str, Any]:
        """
        Generate complete shaft design from high-level requirements.

        This automatically sizes the shaft to meet:
        - Deflection limits (< 0.005")
        - Critical speed requirements (> 30% margin)
        - Stress limits (SF > 2.0)

        Args:
            power: Transmitted power (HP)
            speed: Operating speed (RPM)
            overhang: Impeller overhang distance (inches)
            bearing_span: Distance between bearings (inches)
            material: Material designation
            application_factor: Service factor for varying loads

        Returns:
            Complete shaft geometry with features

        Example:
            >>> result = await client.generate_shaft_geometry(
            ...     power=100,
            ...     speed=3600,
            ...     overhang=2,
            ...     bearing_span=20,
            ...     material="AISI 4140"
            ... )
            >>> print(result["diameter"])  # inches
            2.5
            >>> print(len(result["features"]))  # number of features
            9
        """
        data = {
            "power": power,
            "speed": speed,
            "overhang": overhang,
            "bearingSpan": bearing_span,
            "material": material,
            "applicationFactor": application_factor,
        }

        response = await self._call_endpoint("POST", "/api/shaft/generate", data)

        if not response.success:
            raise Exception(f"Geometry generation failed: {response.error}")

        return response.result

    # =========================================================================
    # Complete Analysis
    # =========================================================================

    async def analyze_shaft(
        self,
        power: float,
        speed: float,
        overhang: float,
        bearing_span: float,
        material: str = "AISI 4140",
        application_factor: float = 1.5
    ) -> Dict[str, Any]:
        """
        Run complete shaft analysis (all calculations in one call).

        This is the most convenient method - generates geometry and
        validates it against all engineering criteria.

        Args:
            power: Transmitted power (HP)
            speed: Operating speed (RPM)
            overhang: Impeller overhang distance (inches)
            bearing_span: Distance between bearings (inches)
            material: Material designation
            application_factor: Service factor

        Returns:
            Complete analysis including:
            - geometry: Shaft design with features
            - deflection: Deflection analysis
            - criticalSpeed: Critical speed analysis
            - stress: Stress analysis
            - summary: Pass/fail summary

        Example:
            >>> result = await client.analyze_shaft(
            ...     power=100,
            ...     speed=3600,
            ...     overhang=2,
            ...     bearing_span=20
            ... )
            >>> print(result["summary"]["overallPassed"])
            True
        """
        data = {
            "power": power,
            "speed": speed,
            "overhang": overhang,
            "bearingSpan": bearing_span,
            "material": material,
            "applicationFactor": application_factor,
        }

        response = await self._call_endpoint("POST", "/api/shaft/analyze", data)

        if not response.success:
            raise Exception(f"Shaft analysis failed: {response.error}")

        return response.result

    # =========================================================================
    # Materials
    # =========================================================================

    async def get_materials(self) -> list:
        """Get all available materials"""
        response = await self._call_endpoint("GET", "/api/materials")
        return response.result

    async def get_material_properties(self, designation: str) -> Dict[str, Any]:
        """Get properties for specific material"""
        response = await self._call_endpoint("GET", f"/api/materials/{designation}")
        return response.result

    async def suggest_material(
        self,
        min_yield_psi: float,
        environment: str = "standard"
    ) -> list:
        """
        Suggest materials for shaft application.

        Args:
            min_yield_psi: Minimum yield strength required (psi)
            environment: 'standard', 'corrosive', or 'high-temp'

        Returns:
            List of suggested materials sorted by cost-effectiveness
        """
        data = {
            "minYieldPsi": min_yield_psi,
            "environment": environment,
        }

        response = await self._call_endpoint("POST", "/api/materials/suggest", data)
        return response.result


# Global client instance (can be imported and used directly)
mcp_client = MCPClient()
