# CAD Autonomous Engine

An AI-powered CAD SaaS platform with natural language processing capabilities for automated CAD operations.

## 🏗️ Project Structure

This is a monorepo managed with pnpm workspaces, containing:

```
CAD_Autonomous_Engine/
├── packages/
│   ├── frontend/          # Next.js 14 frontend (TypeScript)
│   ├── backend/           # Fastify API server (TypeScript)
│   ├── cad-engine/        # CAD processing service (Python/FastAPI)
│   └── ai-service/        # AI/LLM service (Python/FastAPI)
├── docs/                  # Documentation
├── docker-compose.yml     # Local development services
└── pnpm-workspace.yaml    # Workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Python** >= 3.11
- **Docker** and **Docker Compose** (for local services)
- **Git**

### Initial Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd CAD_Autonomous_Engine
```

2. **Install Node.js dependencies**

```bash
pnpm install
```

3. **Set up Python services**

For CAD Engine:
```bash
cd packages/cad-engine
./setup.sh
# Copy and configure environment variables
cp .env.example .env
```

For AI Service:
```bash
cd packages/ai-service
./setup.sh
# Copy and configure environment variables
cp .env.example .env
# Add your API keys (Anthropic, OpenAI, Pinecone)
```

4. **Set up environment variables for Node.js services**

Frontend:
```bash
cd packages/frontend
cp .env.example .env
```

Backend:
```bash
cd packages/backend
cp .env.example .env
```

5. **Start local development services (PostgreSQL, Redis)**

```bash
# From project root
pnpm docker:up
```

## 🎯 Development

### Running All Services

```bash
# From project root
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- CAD Engine: http://localhost:8000
- AI Service: http://localhost:8001

### Running Individual Services

**Frontend:**
```bash
pnpm dev:frontend
```

**Backend:**
```bash
pnpm dev:backend
```

**CAD Engine:**
```bash
cd packages/cad-engine
source venv/bin/activate
python -m app.main
```

**AI Service:**
```bash
cd packages/ai-service
source venv/bin/activate
python -m app.main
```

## 📦 Package Details

### Frontend (@cad-engine/frontend)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **3D Rendering:** Three.js + React Three Fiber
- **State Management:** Zustand
- **Data Fetching:** TanStack Query

**Key Features:**
- 3D CAD model viewer
- Real-time AI assistant interface
- Responsive design with dark mode support

### Backend (@cad-engine/backend)

- **Framework:** Fastify
- **Language:** TypeScript (ES Modules)
- **Database:** PostgreSQL (via Docker)
- **Cache:** Redis (via Docker)

**Key Features:**
- RESTful API
- Rate limiting
- CORS configuration
- Health check endpoints
- Swagger documentation (planned)

### CAD Engine (cad-engine)

- **Framework:** FastAPI
- **Language:** Python 3.11+
- **CAD Library:** pythonOCC-core (commented in requirements)

**Key Features:**
- CAD file processing
- Geometry operations
- 3D model manipulation
- Export to various formats

### AI Service (ai-service)

- **Framework:** FastAPI
- **Language:** Python 3.11+
- **LLM Providers:** Anthropic Claude, OpenAI
- **Vector DB:** Pinecone

**Key Features:**
- Natural language CAD operations
- Context-aware AI assistance
- Semantic search for CAD operations
- RAG (Retrieval-Augmented Generation)

## 🛠️ Available Scripts

From the root directory:

```bash
pnpm dev              # Run all services in development mode
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm format           # Format all code with Prettier
pnpm type-check       # Type check TypeScript packages
pnpm clean            # Clean all build artifacts and dependencies
pnpm docker:up        # Start Docker services
pnpm docker:down      # Stop Docker services
pnpm docker:logs      # View Docker logs
```

## 🔧 Configuration

### Environment Variables

Each package has its own `.env.example` file. Copy these to `.env` and configure:

- **Frontend:** API endpoints, feature flags
- **Backend:** Database URL, Redis URL, CORS origins
- **CAD Engine:** Processing limits, storage configuration
- **AI Service:** API keys (Anthropic, OpenAI, Pinecone)

### Docker Services

The `docker-compose.yml` provides:
- PostgreSQL on port 5432
- Redis on port 6379
- pgAdmin on port 5050 (optional, use `--profile tools`)

## 📚 Documentation

- [Architecture Decisions](./docs/architecture/)
- [API Documentation](./docs/api/)
- [Development Guides](./docs/guides/)
- [AI Assistant Guide](./CLAUDE.md)

## 🧪 Testing

Run tests for all packages:
```bash
pnpm test
```

Run tests for specific package:
```bash
pnpm --filter @cad-engine/frontend test
pnpm --filter @cad-engine/backend test
```

## 🏗️ Building for Production

Build all packages:
```bash
pnpm build
```

Build specific package:
```bash
pnpm build:frontend
pnpm build:backend
```

## 🔍 Health Checks

All services provide health check endpoints:

- Frontend: http://localhost:3000/api/health
- Backend: http://localhost:3001/health
- CAD Engine: http://localhost:8000/health
- AI Service: http://localhost:8001/health

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📝 Code Style

- **TypeScript/JavaScript:** ESLint + Prettier
- **Python:** Black + Ruff + MyPy
- **Commits:** Conventional Commits format

## 🔐 Security

- Never commit `.env` files or API keys
- All API keys should be stored in environment variables
- Input validation using Zod (TypeScript) and Pydantic (Python)
- Rate limiting enabled on all API endpoints

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🚧 Project Status

**Phase 1: Initial Setup** ✅ (Current)
- Monorepo structure
- All service scaffolding
- Development environment

**Phase 2: Core Features** (Planned)
- CAD file upload and processing
- Basic 3D viewer
- AI chat interface

**Phase 3: Advanced Features** (Planned)
- Advanced CAD operations
- Collaborative editing
- Cloud deployment

## 📞 Support

For issues and questions:
- Open a GitHub issue
- Check the documentation in `/docs`
- Review the [CLAUDE.md](./CLAUDE.md) guide

---

**Built with ❤️ using Next.js, Fastify, FastAPI, and Claude AI**
