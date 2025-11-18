# Deployment Guide - CAD Autonomous Engine

This guide explains how to deploy all services in the CAD Autonomous Engine monorepo.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js)                          │
│                  Deploy to: Vercel                           │
│                  URL: https://your-app.vercel.app            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │               │              │
        ▼              ▼               ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐
│  Backend    │ │ CAD Engine  │ │AI Service│ │  PostgreSQL  │
│  (Fastify)  │ │  (FastAPI)  │ │(FastAPI) │ │    Redis     │
│             │ │             │ │          │ │              │
│  Railway/   │ │  Railway/   │ │ Railway/ │ │   Railway/   │
│  Render     │ │  Render     │ │  Render  │ │   Supabase   │
└─────────────┘ └─────────────┘ └──────────┘ └──────────────┘
```

## 📦 Deployment Platforms

### 1. Frontend → **Vercel** ✅ (Recommended)

**Why Vercel:**
- Optimized for Next.js
- Automatic deployments from Git
- Edge network CDN
- Free tier available

**Setup Steps:**

1. **Install Vercel CLI** (optional)
   ```bash
   pnpm add -g vercel
   ```

2. **Deploy from GitHub** (recommended)
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select `packages/frontend` as the root directory
   - Configure environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     NEXT_PUBLIC_CAD_ENGINE_URL=https://your-cad-engine.railway.app
     NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai-service.railway.app
     ```
   - Click "Deploy"

3. **Or deploy via CLI:**
   ```bash
   cd packages/frontend
   vercel --prod
   ```

**What it looks like:**
- URL: `https://your-project.vercel.app`
- The Next.js app with 3D viewer, dashboard, etc.
- Fast page loads with edge caching

---

### 2. Backend API → **Railway** ✅ (Recommended)

**Why Railway:**
- Easy Node.js deployment
- Built-in PostgreSQL/Redis
- Environment variable management
- Affordable pricing

**Setup Steps:**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will detect the Node.js project
   - Set root directory: `packages/backend`
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=3001
     CORS_ORIGIN=https://your-frontend.vercel.app
     DATABASE_URL=<railway-postgres-url>
     REDIS_URL=<railway-redis-url>
     CAD_ENGINE_URL=https://your-cad-engine.railway.app
     AI_SERVICE_URL=https://your-ai-service.railway.app
     ```

3. **Add PostgreSQL:**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway auto-configures `DATABASE_URL`

4. **Add Redis:**
   - Click "New" → "Database" → "Redis"
   - Railway auto-configures `REDIS_URL`

**What it looks like:**
- URL: `https://your-backend.up.railway.app`
- API endpoints: `/health`, `/api/*`
- Returns JSON responses

---

### 3. CAD Engine → **Railway/Render** ✅

**Option A: Railway** (Easier)

1. **Deploy CAD Engine:**
   - New Project → Deploy from GitHub
   - Root directory: `packages/cad-engine`
   - Build command: `pip install -r requirements.txt`
   - Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment variables:
     ```
     ENVIRONMENT=production
     PORT=8000
     CORS_ORIGINS=["https://your-frontend.vercel.app"]
     ```

**Option B: Docker on Render/Fly.io**

1. **Using Dockerfile** (already created):
   ```bash
   cd packages/cad-engine
   docker build -t cad-engine .
   docker run -p 8000:8000 cad-engine
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - New Web Service → Deploy from GitHub
   - Select Dockerfile
   - Set environment variables

**What it looks like:**
- URL: `https://your-cad-engine.up.railway.app`
- Endpoints: `/health`, `/docs` (FastAPI auto-docs)

---

### 4. AI Service → **Railway/Render** ✅

**Same as CAD Engine, but with additional secrets:**

**Environment Variables:**
```
ENVIRONMENT=production
PORT=8001
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
PINECONE_API_KEY=xxx
PINECONE_ENVIRONMENT=xxx
PINECONE_INDEX_NAME=cad-embeddings
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

**What it looks like:**
- URL: `https://your-ai-service.up.railway.app`
- Endpoints: `/health`, `/docs`, `/chat`, `/embed`

---

## 🔐 Environment Variables Setup

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_CAD_ENGINE_URL=https://your-cad-engine.railway.app
NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai-service.railway.app
NEXT_PUBLIC_APP_NAME="CAD Autonomous Engine"
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Backend (.env.production)
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=https://your-app.vercel.app
DATABASE_URL=<from-railway>
REDIS_URL=<from-railway>
CAD_ENGINE_URL=https://your-cad-engine.railway.app
AI_SERVICE_URL=https://your-ai-service.railway.app
JWT_SECRET=<generate-strong-secret>
```

### CAD Engine (.env.production)
```bash
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["https://your-app.vercel.app"]
MAX_FILE_SIZE_MB=100
```

### AI Service (.env.production)
```bash
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8001
CORS_ORIGINS=["https://your-app.vercel.app"]
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
PINECONE_API_KEY=xxx
```

---

## 🚀 Deployment Workflow

### Automated Deployment (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **All platforms auto-deploy:**
   - Vercel detects changes in `packages/frontend`
   - Railway detects changes in `packages/backend`
   - Railway detects changes in Python services

### Manual Deployment

**Vercel:**
```bash
cd packages/frontend
vercel --prod
```

**Railway:**
```bash
# Railway auto-deploys from Git
# Or use Railway CLI
railway up
```

---

## 🧪 Testing Production Deployment

1. **Check Health Endpoints:**
   ```bash
   curl https://your-frontend.vercel.app/api/health
   curl https://your-backend.railway.app/health
   curl https://your-cad-engine.railway.app/health
   curl https://your-ai-service.railway.app/health
   ```

2. **Test CORS:**
   - Open browser console on frontend
   - Make API request to backend
   - Should not see CORS errors

3. **Check Logs:**
   - Vercel: Dashboard → Deployments → Logs
   - Railway: Project → Service → Logs

---

## 📊 What Each Service Looks Like Deployed

### 1. Frontend (https://your-app.vercel.app)
**Visual:**
- Landing page with "CAD Autonomous Engine" title
- 3D viewer interface
- AI chat sidebar
- Dashboard with projects

**Files served:**
- HTML pages
- JavaScript bundles
- CSS styles
- Static assets

---

### 2. Backend API (https://your-backend.railway.app)
**Not visual - JSON API**

**Example responses:**

`GET /health`
```json
{
  "status": "healthy",
  "service": "backend-api",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "0.1.0",
  "uptime": 86400
}
```

`GET /`
```json
{
  "message": "CAD Autonomous Engine - Backend API",
  "version": "0.1.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 3. CAD Engine (https://your-cad-engine.railway.app)
**FastAPI Interactive Docs**

Visit `/docs` to see:
- Swagger UI with all endpoints
- Interactive API testing
- Request/response schemas

---

### 4. AI Service (https://your-ai-service.railway.app)
**FastAPI Interactive Docs**

Visit `/docs` to see:
- Chat endpoints
- Embedding endpoints
- Model configurations

---

## 💰 Cost Estimates

### Free Tier (Hobby Projects)
- **Vercel**: Free (10GB bandwidth/month)
- **Railway**: $5/month credit (enough for small apps)
- **Render**: Free tier available (slower cold starts)

### Production Scale
- **Vercel Pro**: $20/month
- **Railway**: ~$20-50/month (based on usage)
- **Database**: Railway includes PostgreSQL/Redis in compute costs
- **AI APIs**: Pay-per-token (Anthropic, OpenAI)

---

## 🔍 Troubleshooting

### "Cannot connect to backend"
- Check CORS configuration
- Verify environment variables
- Check backend logs

### "502 Bad Gateway"
- Backend service may be down
- Check Railway service status
- Verify PORT configuration

### "Vercel deployment failed"
- Check build logs
- Verify package.json scripts
- Check Next.js configuration

---

## 📝 Summary

✅ **Frontend (Next.js)** → Vercel
✅ **Backend (Fastify)** → Railway
✅ **CAD Engine (FastAPI)** → Railway/Render
✅ **AI Service (FastAPI)** → Railway/Render
✅ **Database** → Railway PostgreSQL
✅ **Cache** → Railway Redis

**Total Platforms Needed:** 1-2 (Vercel + Railway is simplest)

---

## 🎯 Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Add PostgreSQL and Redis on Railway
4. Deploy Python services to Railway
5. Configure environment variables
6. Test all health endpoints
7. Update frontend URLs to point to production APIs

Need help? Check the logs first, then refer to platform documentation.
