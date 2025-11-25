# Quick Start Guide - CAD Engine Deployment

## 🚀 Deploy Backend (5 minutes)

### Prerequisites
- Cloudflare account (free tier works)
- Node.js and npm installed

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Navigate to backend
cd packages/backend

# 2. Authenticate with Cloudflare
wrangler login
# This opens a browser window - click "Allow" to authenticate

# 3. Run deployment script
./DEPLOY.sh
```

The script will automatically:
- ✅ Create D1 database
- ✅ Apply database schema
- ✅ Create R2 storage bucket
- ✅ Set Clerk authentication secret
- ✅ Deploy Worker to Cloudflare
- ✅ Test endpoints

**Expected Output:**
```
Worker deployed at: https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev
✅ Health check passed
✅ Database connection working
```

### Option 2: Manual Step-by-Step

See `packages/backend/CLOUDFLARE_SETUP_MANUAL.md` for detailed instructions.

---

## 🌐 Deploy Frontend (Vercel Dashboard)

Since the Vercel API token needs verification, deploy via the dashboard:

### Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository**
   - Select your GitHub repository: `CAD_Autonomous_Engine`
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: (leave blank)
   Build Command: cd packages/frontend && pnpm build
   Output Directory: packages/frontend/.next
   Install Command: pnpm install --no-frozen-lockfile
   ```

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVuZXdlZC1oaXBwby05MC5jbGVyay5hY2NvdW50cy5kZXYk
   CLERK_SECRET_KEY=sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects
   NEXT_PUBLIC_API_URL=https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev
   ```
   **Important:** Replace `YOUR-SUBDOMAIN` with your actual Worker URL from Step 1

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://cad-engine.vercel.app`

---

## 🔗 Connect Services

### 1. Update Clerk Allowed Origins

1. Go to: https://dashboard.clerk.com/
2. Select your application
3. Navigate to: **API Keys** → **Advanced** → **Allowed Origins**
4. Add:
   - `https://cad-engine.vercel.app` (your Vercel URL)
   - `http://localhost:3000` (for local development)

### 2. Update Backend CORS

Edit `packages/backend/src/index.ts` line 29:
```typescript
origin: (origin) => origin, // Change this to specific origins for production:
// origin: ['http://localhost:3000', 'https://cad-engine.vercel.app'],
```

Redeploy backend:
```bash
cd packages/backend
wrangler deploy
```

---

## ✅ Verify Deployment

### Test Backend

```bash
# Health check
curl https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/health

# Expected: {"status":"ok","timestamp":"...","environment":"production"}

# Database test
curl https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/test-db

# Expected: {"success":true,"result":{"test":1}}
```

### Test Frontend

1. Visit your Vercel URL: `https://cad-engine.vercel.app`
2. Homepage should load without errors
3. Click "Sign In" → should redirect to Clerk
4. Create a test account
5. Should redirect to `/projects` after signup
6. Check browser console for any errors

### Test Integration

```bash
# From your frontend app after signing in, the app should:
# - Authenticate with Clerk
# - Fetch projects from backend
# - Create new projects
# - View CAD models

# You can test the API directly with:
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/api/projects
```

---

## 🐛 Troubleshooting

### Backend Issues

**"Database not found"**
```bash
# Verify database exists
wrangler d1 list

# Should show: cad-engine-db

# Check database_id in wrangler.toml
cat wrangler.toml | grep database_id
```

**"Bucket not found"**
```bash
# Verify R2 bucket exists
wrangler r2 bucket list

# Should show: cad-engine-files
```

**"Clerk authentication failed"**
```bash
# Verify secret is set
wrangler secret list

# Should show: CLERK_SECRET_KEY

# Re-set if needed
echo "sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d" | wrangler secret put CLERK_SECRET_KEY
```

### Frontend Issues

**"Build failed"**
- Check Vercel build logs
- Verify all environment variables are set
- Test build locally: `cd packages/frontend && pnpm build`

**"Clerk not working"**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Vercel env vars
- Check Clerk dashboard allowed origins
- Clear browser cache and cookies

**"CORS error"**
- Add your Vercel URL to backend CORS origins (see "Connect Services" above)
- Redeploy backend after updating CORS
- Check browser console for exact error message

---

## 📊 Current Credentials

### Clerk
```
Publishable Key: pk_test_cmVuZXdlZC1oaXBwby05MC5jbGVyay5hY2NvdW50cy5kZXYk
Secret Key: sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d
Dashboard: https://dashboard.clerk.com/
```

### Cloudflare
```
Dashboard: https://dash.cloudflare.com/
```

### Vercel
```
Dashboard: https://vercel.com/dashboard
```

---

## 🎯 Quick Reference

### Backend Commands
```bash
# Start local development
wrangler dev

# Deploy to production
wrangler deploy

# View logs
wrangler tail

# Query database
wrangler d1 execute cad-engine-db --command "SELECT * FROM users"

# List R2 files
wrangler r2 object list cad-engine-files
```

### Frontend Commands
```bash
cd packages/frontend

# Start local development
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

---

## 📚 Additional Documentation

- **DEPLOYMENT_STATUS.md** - Current deployment status and detailed checklist
- **packages/backend/CLOUDFLARE_SETUP_MANUAL.md** - Manual setup guide
- **packages/backend/DEPLOY.sh** - Automated deployment script
- **DEPLOYMENT_GUIDE.md** - Original comprehensive deployment guide

---

## ⏱️ Estimated Time

- Backend deployment: **5 minutes**
- Frontend deployment: **10 minutes**
- Service connection: **5 minutes**
- Testing: **10 minutes**

**Total: ~30 minutes**

---

**Need Help?** Check the troubleshooting section above or review the detailed documentation files.
