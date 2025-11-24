# Cloudflare Infrastructure Setup Guide

This guide walks you through setting up the complete Cloudflare infrastructure stack for the CAD SaaS application.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Cloudflare account (free tier works)
- Clerk account (free tier works)

## Stack Overview

- **Frontend**: Next.js 14 (deployed to Vercel)
- **Backend**: Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: Clerk

---

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

This will open a browser window to authorize Wrangler with your Cloudflare account.

---

## Step 2: Create D1 Database

```bash
cd packages/backend

# Create the database
wrangler d1 create cad-engine-db
```

**IMPORTANT**: Copy the database ID from the output. It will look like:

```
✅ Successfully created DB 'cad-engine-db'!

[[d1_databases]]
binding = "DB"
database_name = "cad-engine-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Update `packages/backend/wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cad-engine-db"
database_id = "YOUR_DATABASE_ID_HERE"  # <- Replace this
```

---

## Step 3: Apply Database Schema

```bash
# Still in packages/backend directory
wrangler d1 execute cad-engine-db --file=./schema.sql
```

This creates all tables and indexes. You should see:

```
✅ Executed 9 commands in 0.123s
```

Verify the schema:

```bash
wrangler d1 execute cad-engine-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: `users`, `projects`, `versions`, `features`

---

## Step 4: Create R2 Bucket

```bash
# Create the storage bucket
wrangler r2 bucket create cad-engine-files
```

The bucket name in `wrangler.toml` should match:

```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "cad-engine-files"
```

### Configure R2 CORS (Optional, for direct uploads)

```bash
# Apply CORS configuration
wrangler r2 bucket cors put cad-engine-files --config=./r2-cors.json
```

Update `r2-cors.json` with your actual frontend URL before applying.

---

## Step 5: Set Up Clerk Authentication

### 5.1 Create Clerk Application

1. Go to https://clerk.com/
2. Sign up / Log in
3. Create a new application
4. Choose "Next.js" as the framework
5. Copy the API keys

### 5.2 Configure Frontend

Create `packages/frontend/.env.local`:

```env
# Clerk Keys (from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects

# API URL (will update after deploying backend)
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 5.3 Configure Backend

Set Clerk secrets for Cloudflare Workers:

```bash
cd packages/backend

# Set Clerk publishable key
wrangler secret put CLERK_PUBLISHABLE_KEY
# Paste your pk_test_... key when prompted

# Set Clerk secret key
wrangler secret put CLERK_SECRET_KEY
# Paste your sk_test_... key when prompted
```

---

## Step 6: Install Backend Dependencies

```bash
cd packages/backend
pnpm install
```

This installs:
- `hono` - Web framework for Cloudflare Workers
- `@hono/clerk-auth` - Clerk authentication middleware
- `wrangler` - Cloudflare CLI
- `@cloudflare/workers-types` - TypeScript types

---

## Step 7: Test Backend Locally

```bash
cd packages/backend

# Start local development server
pnpm dev
```

The backend will run at `http://localhost:8787`

Test the health endpoint:

```bash
curl http://localhost:8787/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

---

## Step 8: Deploy Backend to Cloudflare

```bash
cd packages/backend

# Deploy to Cloudflare Workers
pnpm deploy
```

You should see:

```
✨ Compiled Worker successfully
✨ Uploaded Worker successfully
✨ Deployment complete!
https://cad-engine-backend.your-subdomain.workers.dev
```

**IMPORTANT**: Copy the Worker URL!

---

## Step 9: Update Frontend Environment

Update `packages/frontend/.env.local` with your deployed backend URL:

```env
NEXT_PUBLIC_API_URL=https://cad-engine-backend.your-subdomain.workers.dev
```

Also update the CORS origin in `packages/backend/src/index.ts`:

```typescript
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app'  // <- Add your Vercel URL
  ],
  // ...
}))
```

Redeploy backend after updating CORS:

```bash
cd packages/backend
pnpm deploy
```

---

## Step 10: Test Frontend Locally

```bash
cd packages/frontend
pnpm dev
```

Visit `http://localhost:3000`

### Test Authentication Flow

1. Click "Sign Up" → Should see Clerk sign-up form
2. Create an account
3. Should redirect to `/projects`
4. User should be authenticated

---

## Step 11: Deploy Frontend to Vercel

### Via Vercel Dashboard

1. Go to https://vercel.com/
2. Import your GitHub repository
3. Set environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects
   NEXT_PUBLIC_API_URL=https://cad-engine-backend.your-subdomain.workers.dev
   ```
4. Deploy!

### Via Git Push

If your repo is already connected to Vercel:

```bash
git add .
git commit -m "feat: add Cloudflare infrastructure"
git push
```

Vercel will automatically deploy.

---

## Step 12: Configure Clerk Production Settings

1. Go to Clerk Dashboard
2. Go to "Domains"
3. Add your Vercel domain (e.g., `cad-engine.vercel.app`)
4. Update Allowed Redirect URLs:
   - Add: `https://cad-engine.vercel.app/sign-in`
   - Add: `https://cad-engine.vercel.app/sign-up`
   - Add: `https://cad-engine.vercel.app/projects`

---

## Verification Checklist

After deployment, verify everything works:

### ✅ Backend Health

```bash
curl https://cad-engine-backend.your-subdomain.workers.dev/health
```

Should return `{"status":"ok",...}`

### ✅ Database Connection

```bash
wrangler d1 execute cad-engine-db --command "SELECT COUNT(*) FROM users"
```

Should execute without errors.

### ✅ R2 Storage

```bash
wrangler r2 object list cad-engine-files
```

Should list objects (empty list is fine).

### ✅ Frontend Authentication

1. Visit your Vercel URL
2. Click "Sign Up"
3. Create account
4. Should redirect and be authenticated

### ✅ API Integration

1. Sign in to your app
2. Try creating a project
3. Check browser network tab - should see API calls to your Workers URL
4. Check D1 database:

```bash
wrangler d1 execute cad-engine-db --command "SELECT * FROM projects"
```

Should see your created project!

---

## Troubleshooting

### Database Errors

**Error**: `no such table: projects`

**Solution**: Apply the schema again:
```bash
wrangler d1 execute cad-engine-db --file=./schema.sql
```

### CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS`

**Solution**: Update CORS origins in `packages/backend/src/index.ts` and redeploy:
```bash
pnpm deploy
```

### Authentication Errors

**Error**: `Clerk: Invalid publishable key`

**Solution**: Verify environment variables are set correctly in:
- `packages/frontend/.env.local` (local)
- Vercel dashboard (production)
- Cloudflare Workers secrets (backend)

### Deployment Errors

**Error**: `wrangler: command not found`

**Solution**: Install Wrangler globally:
```bash
npm install -g wrangler
```

---

## Useful Commands

### Backend (Cloudflare Workers)

```bash
# Local development
pnpm dev

# Deploy to production
pnpm deploy

# View logs
wrangler tail cad-engine-backend

# List deployments
wrangler deployments list
```

### Database (D1)

```bash
# Execute SQL file
wrangler d1 execute cad-engine-db --file=./schema.sql

# Run single command
wrangler d1 execute cad-engine-db --command "SELECT * FROM users"

# Interactive SQL shell
wrangler d1 execute cad-engine-db --local

# Export database
wrangler d1 export cad-engine-db --output=backup.sql
```

### Storage (R2)

```bash
# List buckets
wrangler r2 bucket list

# List objects in bucket
wrangler r2 object list cad-engine-files

# Upload file
wrangler r2 object put cad-engine-files/test.txt --file=./test.txt

# Download file
wrangler r2 object get cad-engine-files/test.txt --file=./downloaded.txt

# Delete object
wrangler r2 object delete cad-engine-files/test.txt
```

### Secrets Management

```bash
# Set secret
wrangler secret put SECRET_NAME

# List secrets (names only, not values)
wrangler secret list

# Delete secret
wrangler secret delete SECRET_NAME
```

---

## Cost Estimate

All services have generous free tiers:

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Cloudflare Workers** | 100,000 requests/day | $0.15 per million |
| **D1 Database** | 5GB storage, 5M reads/day | $0.75 per million reads |
| **R2 Storage** | 10GB storage, 1M operations/month | $0.015 per GB/month |
| **Clerk** | 10,000 MAU | $25/month for 10K MAU |
| **Vercel** | 100GB bandwidth | $20/month pro |

**Expected costs for first 1,000 users**: $0-25/month

---

## Next Steps

1. ✅ Infrastructure deployed
2. ⏭️ Connect frontend to backend API
3. ⏭️ Implement CAD operations API
4. ⏭️ Add file upload/download features
5. ⏭️ Set up monitoring and logging
6. ⏭️ Configure custom domain

---

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Clerk Docs**: https://clerk.com/docs
- **Hono Docs**: https://hono.dev/

For issues, check the GitHub repository or contact support.
