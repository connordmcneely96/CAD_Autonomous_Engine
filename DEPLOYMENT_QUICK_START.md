# 🚀 Quick Deployment Guide

## TL;DR - Deploy in 15 Minutes

### Step 1: Frontend → Vercel (5 min)
```bash
1. Go to vercel.com
2. Import GitHub repo
3. Root directory: packages/frontend
4. Add env vars (see below)
5. Deploy
```

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_CAD_ENGINE_URL=https://your-cad-engine.railway.app
NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai-service.railway.app
```

---

### Step 2: Backend → Railway (5 min)
```bash
1. Go to railway.app
2. New Project from GitHub
3. Root directory: packages/backend
4. Add PostgreSQL service
5. Add Redis service
6. Add env vars (see below)
7. Deploy
```

**Environment Variables:**
```
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
DATABASE_URL=<auto-filled-by-railway>
REDIS_URL=<auto-filled-by-railway>
```

---

### Step 3: CAD Engine → Railway (3 min)
```bash
1. New service in Railway project
2. Root directory: packages/cad-engine
3. Build: pip install -r requirements.txt
4. Start: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
5. Deploy
```

---

### Step 4: AI Service → Railway (2 min)
```bash
Same as CAD Engine, but:
- Root directory: packages/ai-service
- Add API keys in env vars
```

**Environment Variables:**
```
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
PINECONE_API_KEY=xxx
```

---

## ✅ Verification Checklist

After deployment, test these URLs:

- [ ] Frontend: `https://your-app.vercel.app`
- [ ] Backend: `https://your-backend.railway.app/health`
- [ ] CAD Engine: `https://your-cad-engine.railway.app/health`
- [ ] AI Service: `https://your-ai-service.railway.app/health`

---

## 🎯 What You'll See

### Frontend (your-app.vercel.app)
A web page with:
- "CAD Autonomous Engine" heading
- Three feature cards (3D Viewer, AI Assistant, Cloud Processing)
- Clean, responsive design

### Backend APIs (*.railway.app/health)
JSON responses like:
```json
{
  "status": "healthy",
  "service": "backend-api",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 💡 Pro Tips

1. **Deploy Backend FIRST** - Get URLs before deploying frontend
2. **Use Railway for everything except frontend** - Simplifies management
3. **Check /health endpoints** - Easiest way to verify services are running
4. **Visit /docs on Python services** - See interactive API documentation

---

## ❌ Common Mistakes

### ❌ Deploying Fastify to Vercel
**Wrong:** Trying to deploy `packages/backend` to Vercel
**Right:** Deploy backend to Railway/Render (needs persistent server)

### ❌ Missing Environment Variables
**Wrong:** Deploying without configuring env vars
**Right:** Add all required env vars before deploying

### ❌ CORS Errors
**Wrong:** Not updating CORS_ORIGIN to match frontend URL
**Right:** Set CORS_ORIGIN=https://your-actual-frontend.vercel.app

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete details.

---

## 🆘 Need Help?

1. Check service logs on Vercel/Railway dashboard
2. Test health endpoints: `/health`, `/health/ready`
3. Verify environment variables are set
4. Check CORS configuration

**Still stuck?** Open an issue on GitHub with:
- Service name
- Error message
- Logs from dashboard
