# MCP Architecture - AI-Native CAD System

## Overview

This document describes the Model Context Protocol (MCP) architecture for the CAD Autonomous Engine, enabling AI agents to perform mechanical engineering design through coordinated calculation servers.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│                   (Next.js + Three.js)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Natural Language Commands
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Primary Design Agent                         │
│              (AI Service - Claude Orchestrator)                 │
└─┬───────┬──────┬──────┬──────┬──────┬──────┬──────┬───────────┘
  │       │      │      │      │      │      │      │
  │       │      │      │      │      │      │      │
  ▼       ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌───┐   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│Geo│   │Ana│ │Mat│ │Com│ │Mfg│ │Doc│ │CAD│ │Ver│
│   │   │   │ │   │ │   │ │   │ │   │ │   │ │   │
└─┬─┘   └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘
  │       │     │     │     │     │     │     │
  │       │     │     │     │     │     │     │
  ▼       ▼     ▼     ▼     ▼     ▼     ▼     ▼
┌──────────────────────────────────────────────────┐
│              MCP Server Network                  │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Engineering  │  │  Materials   │            │
│  │ Calculations │  │   Database   │            │
│  │   Server     │  │    Server    │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Standards   │  │Manufacturing │            │
│  │  Compliance  │  │   Analysis   │            │
│  │    (RAG)     │  │    Server    │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │     CAD      │  │Documentation │            │
│  │   Geometry   │  │  Generation  │            │
│  │    Server    │  │    Server    │            │
│  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│         Data Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │PostgreSQL│  │ Pinecone │  │Cloudflare│      │
│  │Materials │  │ Vector   │  │    D1    │      │
│  │   DB     │  │    DB    │  │ Projects │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└──────────────────────────────────────────────────┘
```

## Agent Roles

### Primary Design Agent
- **Purpose:** Orchestrates the entire design process
- **Responsibilities:**
  - Parse user requirements using Claude
  - Coordinate specialized agents
  - Maintain design intent and constraints
  - Make high-level design decisions
  - Handle design iteration loops
- **Location:** `packages/ai-service/app/agents/primary_design_agent.py`

### Specialized Agents

#### 1. Geometry Agent
- **Purpose:** Creates and modifies 3D CAD geometry
- **MCP Server:** CAD Geometry Server
- **Capabilities:**
  - Generate initial design proposals
  - Modify geometry based on analysis feedback
  - Create parametric features
  - Export to STEP/STL formats

#### 2. Analysis Agent
- **Purpose:** Performs engineering calculations and analysis
- **MCP Server:** Engineering Calculations Server
- **Capabilities:**
  - Shaft deflection, critical speed, stress analysis
  - Bearing selection and L10 life calculation
  - Bolt stress and preload analysis
  - Mechanical seal selection
  - Nozzle load calculations

#### 3. Materials Agent
- **Purpose:** Selects appropriate materials
- **MCP Server:** Materials Database Server
- **Capabilities:**
  - Material selection based on loading/environment
  - Property lookup (yield strength, modulus, density)
  - Corrosion resistance evaluation
  - Cost optimization
  - Supplier information

#### 4. Compliance Agent
- **Purpose:** Validates designs against engineering standards
- **MCP Server:** Standards Compliance Server (RAG)
- **Capabilities:**
  - ASME code compliance checking
  - API standard validation
  - ASTM specification verification
  - Safety factor requirements
  - Design margin calculations

#### 5. Manufacturing Agent
- **Purpose:** Optimizes for manufacturability
- **MCP Server:** Manufacturing Analysis Server
- **Capabilities:**
  - DFM (Design for Manufacturing) analysis
  - Tolerance stack-up analysis
  - Machinability assessment
  - Cost estimation
  - Lead time prediction

#### 6. Documentation Agent
- **Purpose:** Generates engineering documentation
- **MCP Server:** Documentation Generation Server
- **Capabilities:**
  - Calculation package generation (PDF)
  - Engineering drawings with dimensions
  - Bill of Materials (BOM) creation
  - Assembly instructions
  - Specification sheets

## MCP Server Specifications

### 1. Engineering Calculations Server

**Technology:** Node.js/TypeScript + Express
**Port:** 8100
**Location:** `mcp-servers/engineering-calculations/`

**Exposed Functions:**

```typescript
// Shaft Design
calculate_shaft_deflection(params: ShaftDeflectionParams): DeflectionResult
calculate_critical_speed(params: CriticalSpeedParams): CriticalSpeedResult
calculate_shaft_stress(params: ShaftStressParams): StressResult
select_shaft_material(params: MaterialSelectionParams): MaterialResult
generate_shaft_geometry(params: ShaftGeometryParams): GeometryResult

// Bearing Selection
select_bearing(params: BearingSelectionParams): BearingResult
calculate_bearing_life(params: BearingLifeParams): LifeResult

// Bolt Analysis
calculate_bolt_stress(params: BoltStressParams): BoltStressResult
calculate_bolt_preload(params: BoltPreloadParams): PreloadResult

// Seal Selection
select_mechanical_seal(params: SealSelectionParams): SealResult
```

**Data Format:**
```typescript
interface ShaftDeflectionParams {
  diameter: number;        // inches
  length: number;          // inches
  load: number;           // lbf
  position: number;       // inches from left support
  material: string;       // Material designation
  supportType: 'simply-supported' | 'fixed-fixed' | 'cantilevered';
}

interface DeflectionResult {
  deflection: number;     // inches
  location: number;       // inches
  maxDeflection: number;  // inches
  allowable: number;      // inches
  passed: boolean;
  formula: string;
  reference: string;      // Citation to engineering handbook
}
```

### 2. Materials Database Server

**Technology:** Node.js/TypeScript + PostgreSQL
**Port:** 8101
**Location:** `mcp-servers/materials-database/`

**Database Schema:**
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  designation VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  yield_strength DECIMAL(10,2),      -- psi
  tensile_strength DECIMAL(10,2),    -- psi
  modulus_of_elasticity DECIMAL(10,2), -- psi
  density DECIMAL(10,4),             -- lb/in³
  cost_per_pound DECIMAL(10,2),      -- USD/lb
  corrosion_resistance VARCHAR(50)[],
  temperature_max DECIMAL(10,2),     -- °F
  temperature_min DECIMAL(10,2),     -- °F
  machinability_rating INTEGER,      -- 1-100
  weldability VARCHAR(20),
  applications TEXT[],
  notes TEXT
);

CREATE TABLE material_suppliers (
  id UUID PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  supplier_name VARCHAR(100),
  lead_time_days INTEGER,
  minimum_order_quantity INTEGER,
  price_per_unit DECIMAL(10,2)
);
```

**Exposed Functions:**
```typescript
search_materials(criteria: MaterialSearchCriteria): Material[]
get_material_properties(designation: string): MaterialProperties
suggest_material(requirements: DesignRequirements): MaterialSuggestion[]
compare_materials(designations: string[]): MaterialComparison
get_suppliers(designation: string): Supplier[]
```

### 3. Standards Compliance Server (RAG)

**Technology:** Python + FastAPI + Pinecone
**Port:** 8102
**Location:** `mcp-servers/standards-compliance/`

**Vector Database Schema:**
```python
class StandardDocument:
    id: str                    # Unique identifier
    source: str               # "ASME B31.3", "API 610", etc.
    section: str              # Section number
    title: str                # Section title
    content: str              # Full text
    embedding: List[float]    # 1536-dim vector (OpenAI)
    category: str             # "pressure vessels", "piping", etc.
    applicability: List[str]  # Component types
    mandatory: bool           # True if requirement is mandatory
    date_revised: str         # Last revision date
    supersedes: Optional[str] # Previous version
```

**Exposed Functions:**
```python
check_compliance(design: DesignData, standard: str) -> ComplianceResult
search_standards(query: str, filters: Dict) -> List[StandardSection]
get_requirements(component_type: str) -> List[Requirement]
validate_safety_factor(design: DesignData) -> ValidationResult
```

### 4. Manufacturing Analysis Server

**Technology:** Node.js/TypeScript + Express
**Port:** 8103
**Location:** `mcp-servers/manufacturing-analysis/`

**Exposed Functions:**
```typescript
analyze_dfm(geometry: CADGeometry): DFMAnalysis
calculate_tolerance_stackup(assembly: AssemblyData): ToleranceResult
estimate_cost(geometry: CADGeometry, quantity: number): CostEstimate
assess_machinability(geometry: CADGeometry, material: string): MachinabilityScore
suggest_manufacturing_improvements(geometry: CADGeometry): Improvement[]
```

### 5. Documentation Generation Server

**Technology:** Python + FastAPI + ReportLab
**Port:** 8104
**Location:** `mcp-servers/documentation-generation/`

**Exposed Functions:**
```python
generate_calculation_package(design: DesignData, calculations: Dict) -> PDF
generate_drawing(geometry: CADGeometry, views: List[str]) -> PDF
generate_bom(assembly: AssemblyData) -> BOM
generate_specification_sheet(design: DesignData) -> PDF
```

### 6. CAD Geometry Server

**Technology:** Extends existing `cad-engine` (Python + OCCT)
**Port:** 8000 (existing)
**Location:** `packages/cad-engine/` (enhanced)

**New MCP Functions:**
```python
create_shaft_from_calculations(calc_results: ShaftCalculations) -> CADGeometry
create_bearing_seat(bearing_data: BearingData, shaft_diameter: float) -> CADFeature
create_keyway(shaft_diameter: float, key_size: str, position: float) -> CADFeature
create_shoulder(diameter_change: float, position: float, radius: float) -> CADFeature
apply_tolerances(feature_id: str, tolerances: ToleranceSpec) -> CADFeature
```

## Agent Collaboration Flow

### Example: Pump Shaft Design

**User Input:**
```
"Design a pump shaft for 100 HP at 3600 RPM with a 2-inch impeller overhang"
```

**Step 1: Primary Design Agent Parses Requirements**
```json
{
  "power": 100,
  "unit": "HP",
  "speed": 3600,
  "unit": "RPM",
  "overhang": 2,
  "unit": "inches",
  "component_type": "pump_shaft"
}
```

**Step 2: Geometry Agent Proposes Initial Design**
```typescript
// Call Engineering Calculations Server
const torque = (100 * 5252) / 3600;  // lb-ft
const preliminary_diameter = calculate_preliminary_diameter(torque);

// Initial geometry proposal
{
  diameter: 2.5,  // inches
  length: 24,     // inches
  material: "AISI 4140",
  features: [
    {type: "bearing_seat", position: 6, diameter: 3.0},
    {type: "bearing_seat", position: 18, diameter: 3.0},
    {type: "impeller_mount", position: 22, diameter: 2.5}
  ]
}
```

**Step 3: Analysis Agent Validates Design**
```typescript
// Call multiple calculation endpoints
const deflection = await mcp.call('calculate_shaft_deflection', {
  diameter: 2.5,
  length: 24,
  load: radial_load,
  position: 22,
  material: "AISI 4140"
});

const critical_speed = await mcp.call('calculate_critical_speed', {
  diameter: 2.5,
  length: 24,
  material: "AISI 4140"
});

const stress = await mcp.call('calculate_shaft_stress', {
  diameter: 2.5,
  torque: torque,
  bending_moment: bending_moment
});

// Validation results
{
  deflection_check: {
    actual: 0.003,
    allowable: 0.005,
    passed: true
  },
  critical_speed_check: {
    actual: 4800,
    operating: 3600,
    margin: 1.33,
    required_margin: 1.30,
    passed: true
  },
  stress_check: {
    actual: 18000,
    allowable: 32000,
    safety_factor: 1.78,
    required_sf: 1.5,
    passed: true
  }
}
```

**Step 4: Materials Agent Validates Material Selection**
```typescript
const material_check = await mcp.call('get_material_properties', {
  designation: "AISI 4140"
});

// Check if material meets requirements
{
  yield_strength: 64000,  // psi
  required: 36000,        // psi
  passed: true,
  alternatives: ["4340", "316SS"],
  cost_comparison: {
    "AISI 4140": 2.50,    // $/lb
    "4340": 3.80,
    "316SS": 4.20
  }
}
```

**Step 5: Compliance Agent Checks API 610**
```python
compliance = await mcp.call('check_compliance', {
  design: shaft_design,
  standard: "API 610"
})

# RAG retrieves relevant sections
{
  "sections_checked": [
    "API 610 Section 2.3.4.1 - Shaft Design",
    "API 610 Section 2.3.4.2 - Deflection Limits",
    "API 610 Section 2.3.4.3 - Critical Speed"
  ],
  "compliance_status": "PASS",
  "findings": [
    {
      "requirement": "Deflection at seal < 0.002 inches",
      "actual": 0.0015,
      "status": "PASS"
    },
    {
      "requirement": "First critical speed > 1.3 × operating speed",
      "actual": 1.33,
      "status": "PASS"
    }
  ]
}
```

**Step 6: Manufacturing Agent Analyzes Producibility**
```typescript
const dfm = await mcp.call('analyze_dfm', {
  geometry: shaft_geometry,
  material: "AISI 4140"
});

{
  machinability_score: 85,
  estimated_cost: 450,      // USD
  lead_time: 14,            // days
  manufacturing_method: "CNC Turning",
  suggestions: [
    "Reduce shoulder radius from 0.375 to 0.250 for easier machining",
    "Consider rolled threads instead of cut threads for keyway"
  ]
}
```

**Step 7: Documentation Agent Generates Reports**
```python
calc_package = await mcp.call('generate_calculation_package', {
  design: shaft_design,
  calculations: all_calculations,
  standards: ["API 610"]
})

drawing = await mcp.call('generate_drawing', {
  geometry: shaft_geometry,
  views: ["front", "section_a-a"],
  dimensions: auto_dimension_results
})

# Returns PDF files ready for engineer review
```

**Step 8: Iteration (if needed)**

If any check fails, the Primary Design Agent coordinates refinement:

```typescript
// Example: Deflection too high
if (!deflection_check.passed) {
  // Ask Geometry Agent to increase diameter
  const refined_design = await geometry_agent.refine({
    issue: "deflection_exceeded",
    suggestion: "increase_diameter",
    current_diameter: 2.5,
    target_deflection: 0.005
  });

  // Re-run all checks with new geometry
  // Loop until all constraints satisfied
}
```

## Implementation Priority

### Phase 1: Foundation (Current Sprint)
1. ✅ Create MCP server directory structure
2. ✅ Implement Engineering Calculations Server (shaft design)
3. ✅ Implement Materials Database Server
4. ✅ Basic multi-agent orchestration

### Phase 2: Intelligence (Next Sprint)
5. ✅ Implement Standards Compliance Server (RAG)
6. ✅ Enhance agent collaboration logic
7. ✅ Add iterative refinement loops

### Phase 3: Production (Following Sprint)
8. ✅ Manufacturing Analysis Server
9. ✅ Documentation Generation Server
10. ✅ Full frontend integration

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary Agent | Python + Claude API | Orchestration |
| Calc Server | Node.js/TypeScript | Fast calculations |
| Materials DB | PostgreSQL | Structured data |
| Compliance RAG | Python + Pinecone | Vector search |
| CAD Server | Python + OCCT | Geometry operations |
| Documentation | Python + ReportLab | PDF generation |
| Frontend | Next.js + Three.js | User interface |

## Communication Protocol

All MCP servers expose REST APIs with standard format:

**Request:**
```json
{
  "function": "calculate_shaft_deflection",
  "parameters": {
    "diameter": 2.5,
    "length": 24,
    "load": 500,
    "position": 22,
    "material": "AISI 4140"
  },
  "context": {
    "project_id": "proj-123",
    "design_intent": "minimize_deflection"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "deflection": 0.003,
    "max_deflection": 0.0035,
    "allowable": 0.005,
    "passed": true,
    "formula": "δ = (P × a × b × L²) / (3 × E × I)",
    "reference": "Roark's Formulas, Table 8.1"
  },
  "metadata": {
    "calculation_time_ms": 12,
    "confidence": 0.98,
    "assumptions": [
      "Simply supported beam",
      "Point load at impeller"
    ]
  }
}
```

## Security & Authentication

- All MCP servers require API key authentication
- Cloudflare Workers backend acts as API gateway
- Rate limiting on all endpoints
- Input validation using Zod/Pydantic
- Audit logging for all calculations

## Monitoring & Observability

- Health check endpoints on all servers
- Prometheus metrics for calculation performance
- Distributed tracing for agent coordination
- Error reporting to Sentry
- Cost tracking for Claude API usage

---

**Next Steps:** Begin implementation of Engineering Calculations Server with real mechanical engineering formulas.
