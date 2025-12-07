# MCP Servers - AI-Native CAD System

This directory contains the Model Context Protocol (MCP) servers that provide specialized capabilities for the AI-driven CAD system.

## Server Overview

| Server | Port | Technology | Purpose |
|--------|------|-----------|---------|
| Engineering Calculations | 8100 | Node.js/TypeScript | Mechanical engineering calculations |
| Materials Database | 8101 | Node.js + PostgreSQL | Material properties and selection |
| Standards Compliance | 8102 | Python + Pinecone | Code compliance checking (RAG) |
| Manufacturing Analysis | 8103 | Node.js/TypeScript | DFM analysis and cost estimation |
| Documentation Generation | 8104 | Python + ReportLab | PDF reports and drawings |

## Quick Start

### Install All Dependencies

```bash
# From mcp-servers directory
cd engineering-calculations && npm install && cd ..
cd materials-database && npm install && cd ..
cd manufacturing-analysis && npm install && cd ..
cd standards-compliance && pip install -r requirements.txt && cd ..
cd documentation-generation && pip install -r requirements.txt && cd ..
```

### Start All Servers

```bash
# Option 1: Use Docker Compose (recommended)
docker-compose up

# Option 2: Start individually
cd engineering-calculations && npm run dev &
cd materials-database && npm run dev &
cd manufacturing-analysis && npm run dev &
cd standards-compliance && python -m app.main &
cd documentation-generation && python -m app.main &
```

### Health Checks

```bash
curl http://localhost:8100/health  # Engineering Calculations
curl http://localhost:8101/health  # Materials Database
curl http://localhost:8102/health  # Standards Compliance
curl http://localhost:8103/health  # Manufacturing Analysis
curl http://localhost:8104/health  # Documentation Generation
```

## Server Details

### 1. Engineering Calculations Server (Port 8100)

**Purpose:** Provides mechanical engineering calculations for shaft design, bearings, bolts, and seals.

**Key Functions:**
- `calculate_shaft_deflection` - Beam deflection analysis
- `calculate_critical_speed` - Rotordynamics
- `calculate_shaft_stress` - Combined stress analysis
- `select_bearing` - Bearing selection and L10 life
- `calculate_bolt_stress` - Bolt joint analysis

**Example Request:**
```bash
curl -X POST http://localhost:8100/api/shaft/deflection \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 2.5,
    "length": 24,
    "load": 500,
    "position": 22,
    "material": "AISI 4140"
  }'
```

### 2. Materials Database Server (Port 8101)

**Purpose:** Material property database with selection algorithms.

**Database:** PostgreSQL with 500+ materials

**Key Functions:**
- `search_materials` - Search by properties
- `get_material_properties` - Get detailed properties
- `suggest_material` - AI-powered material selection
- `compare_materials` - Side-by-side comparison

### 3. Standards Compliance Server (Port 8102)

**Purpose:** RAG system for engineering standards (ASME, API, ASTM).

**Vector Database:** Pinecone (10,000+ embedded sections)

**Key Functions:**
- `check_compliance` - Validate design against standards
- `search_standards` - Semantic search
- `get_requirements` - Get requirements for component type

### 4. Manufacturing Analysis Server (Port 8103)

**Purpose:** Design for manufacturing analysis and cost estimation.

**Key Functions:**
- `analyze_dfm` - Manufacturability scoring
- `calculate_tolerance_stackup` - Tolerance analysis
- `estimate_cost` - Manufacturing cost estimation
- `assess_machinability` - Material machinability rating

### 5. Documentation Generation Server (Port 8104)

**Purpose:** Automated generation of engineering documentation.

**Key Functions:**
- `generate_calculation_package` - Complete calc package PDF
- `generate_drawing` - Engineering drawings with dimensions
- `generate_bom` - Bill of materials
- `generate_spec_sheet` - Specification sheets

## Development

### Running Tests

```bash
# Each server has its own test suite
cd engineering-calculations && npm test
cd materials-database && npm test
cd manufacturing-analysis && npm test
cd standards-compliance && pytest
cd documentation-generation && pytest
```

### Adding New Functions

See individual server READMEs for development guidelines.

## Architecture

All servers follow MCP protocol:

1. **REST API** - Standard HTTP endpoints
2. **JSON Schema** - Pydantic/Zod validation
3. **Error Handling** - Consistent error responses
4. **Authentication** - API key required
5. **Rate Limiting** - Prevents abuse
6. **Logging** - Structured logging to stdout

## Deployment

See `../docs/DEPLOYMENT.md` for production deployment instructions.

Each server can be deployed independently:
- **Node.js servers** → Railway/Render
- **Python servers** → Railway/Render
- **Database** → Supabase/Railway

## Contributing

See `../CONTRIBUTING.md` for contribution guidelines.
