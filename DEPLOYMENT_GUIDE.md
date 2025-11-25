# Deployment Guide - CAD Autonomous Engine

## Current Status

✅ **Build Fixed**: Frontend builds successfully with Clerk authentication
✅ **Middleware Updated**: Using latest Clerk API (`clerkMiddleware`)
✅ **Auth Pages Created**: Sign-in and sign-up pages ready
✅ **Environment Configured**: Local `.env.local` with Clerk credentials

## Vercel Deployment

### Prerequisites

You have these credentials ready:
- **Clerk Publishable Key**: `pk_test_cmVuZXdlZC1oaXBwby05MC5jbGVyay5hY2NvdW50cy5kZXYk`
- **Clerk Secret Key**: `sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d`

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository: `connordmcneely96/CAD_Autonomous_Engine`
   - Framework Preset: **Next.js**
   - Root Directory: Leave blank (monorepo will be detected)

3. **Configure Build Settings**:
   ```
   Build Command: cd packages/frontend && pnpm build
   Output Directory: packages/frontend/.next
   Install Command: pnpm install --no-frozen-lockfile
   ```

4. **Add Environment Variables**:
   
   Add these in the "Environment Variables" section:
   
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVuZXdlZC1oaXBwby05MC5jbGVyay5hY2NvdW50cy5kZXYk
   CLERK_SECRET_KEY=sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects
   ```

5. **Deploy**: Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend
cd packages/frontend

# Deploy
vercel --prod

# When prompted, configure:
# - Link to existing project or create new
# - Set build settings as above
# - Vercel will prompt for environment variables
```

### Option 3: Auto-Deploy from GitHub

If your repository is already connected to Vercel:

1. **Push to main/master branch**:
   ```bash
   git checkout main
   git merge claude/setup-cad-saas-monorepo-01XGNWqyuNUReUJfoeDFaUXT
   git push origin main
   ```

2. **Vercel will automatically deploy** on push

3. **Add environment variables** in Vercel Dashboard → Settings → Environment Variables

## Post-Deployment Configuration

### 1. Update Clerk Allowed Origins

1. Go to **Clerk Dashboard**: https://dashboard.clerk.com/
2. Navigate to your application
3. Go to **API Keys** → **Advanced** → **Allowed Origins**
4. Add your Vercel deployment URL:
   ```
   https://your-app.vercel.app
   ```

### 2. Update Frontend Environment Variables

If you need to update the API URL after deploying backend:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add or update:
   ```
   NEXT_PUBLIC_API_URL=https://your-cloudflare-worker.workers.dev
   ```
3. Redeploy to apply changes

### 3. Configure Cloudflare Backend

After Cloudflare D1 and Workers are set up (see `CLOUDFLARE_SETUP.md`):

1. Update Cloudflare Worker CORS to allow your Vercel domain:
   ```typescript
   // In packages/backend/src/index.ts
   app.use('*', cors({
     origin: [
       'http://localhost:3000',
       'https://your-app.vercel.app'  // Add your Vercel URL
     ],
     // ...
   }))
   ```

2. Deploy Cloudflare Worker:
   ```bash
   cd packages/backend
   wrangler deploy
   ```

## Verification Checklist

After deployment, verify:

- [ ] **Homepage loads**: Visit your Vercel URL
- [ ] **Sign-in works**: Click "Sign In" → Redirects to Clerk
- [ ] **Sign-up works**: Create test account
- [ ] **Protected routes**: Try accessing `/projects` (should redirect if not logged in)
- [ ] **Dashboard loads**: After signing in, `/projects` should load
- [ ] **No console errors**: Check browser console for errors

## Build Configuration Files

### `vercel.json` (Project Root)

Already configured:
```json
{
  "version": 2,
  "buildCommand": "cd packages/frontend && pnpm build",
  "devCommand": "cd packages/frontend && pnpm dev",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "outputDirectory": "packages/frontend/.next",
  "framework": null,
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./packages/frontend"
}
```

### `packages/frontend/.env.local` (Local Only)

Already created - do **NOT** commit this file:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVuZXdlZC1oaXBwby05MC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_CAD_ENGINE_URL=http://localhost:8000
```

## Troubleshooting

### Build Fails: "Missing publishableKey"

**Solution**: Ensure environment variables are set in Vercel:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. Redeploy

### Build Fails: "Module not found"

**Solution**: Check that all dependencies are in `dependencies` (not `devDependencies`):
```bash
cd packages/frontend
pnpm install
pnpm build  # Test locally first
```

### Clerk Auth Fails: "Invalid publishable key"

**Solution**: 
1. Verify the key is correct in Vercel environment variables
2. Make sure it starts with `pk_test_` or `pk_live_`
3. Check Clerk Dashboard for the correct key

### Next.js Version Warning

**Warning**: Clerk recommends Next.js 14.1.0+

**Optional Fix** (if needed):
```bash
cd packages/frontend
pnpm add next@14.2.0
pnpm build
git add package.json pnpm-lock.yaml
git commit -m "chore: upgrade Next.js to 14.2.0"
git push
```

### Middleware Not Protecting Routes

**Solution**: Ensure `middleware.ts` is in the correct location:
- ✅ Correct: `packages/frontend/middleware.ts`
- ❌ Wrong: `packages/frontend/src/middleware.ts`

## Current Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           USER'S BROWSER                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│     Vercel (Frontend - Next.js 14)          │
│  • Clerk Authentication                     │
│  • Server-Side Rendering                    │
│  • Static Pages                             │
│  • API Routes                               │
└──────────────┬──────────────────────────────┘
               │
               ├──────────► Clerk Auth
               │            (renewed-hippo-90.accounts.dev)
               │
               ├──────────► Cloudflare Workers (Backend API)
               │            • D1 Database
               │            • R2 Storage
               │            • Hono REST API
               │
               └──────────► CAD Engine Service
                            • OpenCascade
                            • FastAPI
                            • STEP/STL Export
```

## Next Steps

1. **Deploy to Vercel** using one of the options above
2. **Set up Cloudflare infrastructure** (see `CLOUDFLARE_SETUP.md`)
3. **Deploy CAD Engine** (see `packages/cad-engine/README.md`)
4. **Connect all services** with proper URLs and CORS

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**All build fixes applied and tested ✓**

Ready for deployment!
