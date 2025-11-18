# AI Service - Natural Language CAD Interface

The AI Service provides a natural language interface for CAD operations, allowing users to create and modify CAD geometry using plain English commands.

## Features

- **Natural Language Processing**: Convert plain English commands to structured CAD operations
- **Claude API Integration**: Uses Anthropic's Claude for intelligent command parsing
- **Knowledge Base**: Engineering specifications and standards (motors, fasteners, materials)
- **Fallback Parser**: Simple keyword-based parser when Claude API is unavailable
- **REST API**: FastAPI-based API with comprehensive documentation

## Architecture

```
ai-service/
├── app/
│   ├── agents/              # AI agents for command processing
│   │   ├── intent_parser.py # Natural language parser with Claude
│   │   └── __init__.py
│   ├── api/                 # API utilities
│   │   └── health.py        # Health check endpoint
│   ├── knowledge/           # Engineering knowledge base
│   │   ├── knowledge_base.py # Engineering facts and specs
│   │   └── __init__.py
│   ├── routes/              # API routes
│   │   ├── ai_routes.py     # AI command processing endpoints
│   │   └── __init__.py
│   ├── config.py            # Configuration management
│   └── main.py              # FastAPI application
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Installation

### Prerequisites

- Python 3.11 or higher
- Anthropic API key (optional, fallback parser available)

### Setup

1. **Install dependencies**:
   ```bash
   cd packages/ai-service
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   Create a `.env` file in the `ai-service` directory:
   ```env
   # Server Configuration
   HOST=0.0.0.0
   PORT=8001
   ENVIRONMENT=development
   LOG_LEVEL=INFO

   # CORS
   CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]

   # AI API Keys
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # Optional
   OPENAI_API_KEY=your_openai_key
   PINECONE_API_KEY=your_pinecone_key
   ```

3. **Run the service**:
   ```bash
   python -m app.main
   ```

   Or with uvicorn directly:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

## API Endpoints

### Base URL
```
http://localhost:8001
```

### Interactive Documentation
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Endpoints

#### 1. Process Natural Language Command
```http
POST /ai/command
Content-Type: application/json

{
  "command": "Create a 50mm cube",
  "context": {
    "project_id": "proj-123",
    "selected_features": ["box-1"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "parsed_command": {
    "operation": "create",
    "geometry": "box",
    "parameters": {
      "width": 50,
      "height": 50,
      "depth": 50,
      "position": {"x": 0, "y": 0, "z": 0}
    },
    "confidence": 0.95,
    "reasoning": "Clear cube creation with all dimensions specified",
    "suggestions": null
  },
  "message": null
}
```

#### 2. Get Example Commands
```http
GET /ai/examples
```

Returns a list of example commands with expected results.

#### 3. Get AI Service Status
```http
GET /ai/status
```

Returns service status, available capabilities, and configuration.

#### 4. Search Knowledge Base
```http
POST /ai/knowledge/search
Content-Type: application/json

{
  "query": "NEMA 23",
  "category": "motors"
}
```

#### 5. Health Check
```http
GET /health
```

## Usage Examples

### Example 1: Create a Box
```bash
curl -X POST http://localhost:8001/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Create a box 10x20x30mm"
  }'
```

### Example 2: Create a Cylinder
```bash
curl -X POST http://localhost:8001/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Make a cylinder radius 5mm, height 20mm"
  }'
```

### Example 3: Add Fillet
```bash
curl -X POST http://localhost:8001/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Add a 2mm fillet to edges 1, 2, 3",
    "context": {
      "selected_features": ["box-1"]
    }
  }'
```

### Example 4: Use Knowledge Base
```bash
curl -X POST http://localhost:8001/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Create a NEMA 23 motor mount"
  }'
```

## Supported Commands

### Operations
- `create` - Make new geometry
- `modify` - Change existing geometry
- `delete` - Remove geometry
- `measure` - Get dimensions
- `analyze` - Analyze properties

### Geometries
- `box` - Rectangular prism (width, height, depth)
- `cylinder` - Cylindrical shape (radius, height)
- `sphere` - Spherical shape (radius)
- `hole` - Cylindrical hole (radius, depth)
- `fillet` - Rounded edge (radius, edge_ids)
- `chamfer` - Beveled edge (distance, angle, edge_ids)
- `extrude` - Extrude 2D sketch (distance, direction)
- `cut` - Cut/subtract (sketch_id, depth)

## Knowledge Base

The service includes an engineering knowledge base with:

### Motors
- NEMA 23 (57mm x 57mm)
- NEMA 17 (42mm x 42mm)

### Fasteners
- M3, M5, M8 specifications
- Thread diameters, clearance holes, tap drills

### Materials
- Aluminum 6061-T6
- Steel 1045
- ABS Plastic

### Tolerances
- General machining tolerances
- 3D printing tolerances (FDM, SLA, SLS)

### Common Dimensions
- Clearances (tight fit, slip fit, loose fit)
- Corner radii
- Wall thicknesses

## Intent Parser Agent

The Intent Parser Agent is the core component that converts natural language to structured commands.

### How It Works

1. **Input**: Natural language command + optional context
2. **Knowledge Enrichment**: Search knowledge base for relevant specs
3. **Claude API**: Send command with system prompt to Claude
4. **Parsing**: Extract structured JSON response
5. **Validation**: Validate using Pydantic models
6. **Fallback**: Use keyword matching if Claude unavailable
7. **Output**: Structured command with confidence score

### Confidence Scoring

- **0.9-1.0**: Very clear, all parameters specified
- **0.7-0.8**: Clear but missing some details
- **0.5-0.6**: Ambiguous, made assumptions
- **0.0-0.4**: Very unclear, low confidence

Commands with confidence < 0.3 are considered failed and should be rephrased.

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
```

### Linting
```bash
ruff check app/
```

### Type Checking
```bash
mypy app/
```

## Integration with Backend

The AI Service is designed to work with the Fastify backend:

```typescript
// Example: Call AI service from backend
const response = await fetch('http://localhost:8001/ai/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: userInput,
    context: { project_id: projectId }
  })
});

const { parsed_command } = await response.json();

// Use parsed_command to call appropriate CAD endpoint
if (parsed_command.geometry === 'box') {
  await cadService.createBox(parsed_command.parameters);
}
```

## Future Enhancements

- [ ] Replace keyword-based knowledge base with vector database (Pinecone)
- [ ] Add multi-step command support (e.g., "Create a box and drill 4 holes")
- [ ] Implement command history and context tracking
- [ ] Add support for more complex geometries (sweeps, lofts, patterns)
- [ ] Integrate with Python CAD engine for direct execution
- [ ] Add visualization preview endpoint
- [ ] Support for assembly operations
- [ ] Material and appearance assignment
- [ ] Parametric design support

## Troubleshooting

### Claude API Not Working
- Check `ANTHROPIC_API_KEY` in `.env`
- Service will automatically use fallback parser
- Check logs for specific error messages

### Low Confidence Scores
- Provide more specific dimensions
- Include units (mm, inches, etc.)
- Use standard terminology
- Check examples at `/ai/examples`

### Knowledge Base Not Finding Results
- Use exact terminology (e.g., "NEMA 23" not "nema23")
- Check available categories at `/ai/status`
- Search is case-insensitive but keyword-based

## License

Part of the CAD Autonomous Engine project.
