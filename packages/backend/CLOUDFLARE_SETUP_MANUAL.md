# Cloudflare Infrastructure Setup - Manual Steps

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare API Token: `CQGMJ0vuEegeQ5VEUi0yvtX9PngU88pI1zj9x6eU`

## Step 1: Authenticate Wrangler

### Option A: Using API Token (Recommended)

```bash
export CLOUDFLARE_API_TOKEN="CQGMJ0vuEegeQ5VEUi0yvtX9PngU88pI1zj9x6eU"
wrangler whoami
```

### Option B: Interactive Login

```bash
wrangler login
```

This will open a browser window to authenticate.

## Step 2: Create D1 Database

```bash
cd packages/backend
wrangler d1 create cad-engine-db
```

**IMPORTANT**: Save the `database_id` from the output. It looks like:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Update `wrangler.toml` line 8:
```toml
database_id = "YOUR_ACTUAL_DATABASE_ID"
```

## Step 3: Apply Database Schema

```bash
wrangler d1 execute cad-engine-db --file=./schema.sql
```

Expected output:
```
🌀 Executing on cad-engine-db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
🌀 To execute on your local development database, pass the --local flag to 'wrangler d1 execute'
🚣 Executed 9 commands in 0.5s
```

Verify tables were created:
```bash
wrangler d1 execute cad-engine-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Should show:
- users
- projects
- versions
- features

## Step 4: Create R2 Bucket

```bash
wrangler r2 bucket create cad-engine-files
```

Verify:
```bash
wrangler r2 bucket list
```

Should show `cad-engine-files`

## Step 5: Configure Clerk Secret

```bash
echo "sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d" | wrangler secret put CLERK_SECRET_KEY
```

Or interactively:
```bash
wrangler secret put CLERK_SECRET_KEY
# Paste: sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d
```

## Step 6: Test Locally

```bash
wrangler dev
```

Visit `http://localhost:8787/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Step 7: Deploy to Cloudflare

```bash
wrangler deploy
```

You'll get a URL like:
```
https://cad-engine-backend.your-subdomain.workers.dev
```

## Step 8: Update Frontend

Add the Worker URL to your frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://cad-engine-backend.your-subdomain.workers.dev
```

And to Vercel environment variables.

## Step 9: Update CORS

Edit `src/index.ts` line 29 and add your Vercel URL:
```typescript
origin: [
  'http://localhost:3000',
  'https://your-app.vercel.app'  // Add this
],
```

Redeploy:
```bash
wrangler deploy
```

## Verification Checklist

- [ ] `wrangler whoami` shows your account
- [ ] `wrangler d1 list` shows `cad-engine-db`
- [ ] `wrangler d1 execute cad-engine-db --command "SELECT COUNT(*) FROM users"` works (returns 0)
- [ ] `wrangler r2 bucket list` shows `cad-engine-files`
- [ ] `wrangler dev` starts local server
- [ ] `curl http://localhost:8787/health` returns success
- [ ] `wrangler deploy` succeeds
- [ ] Production URL responds to `/health`

## Troubleshooting

### "Authentication error"

**Solution**: Run `wrangler login` or verify your API token

### "Database not found"

**Solution**: Make sure you created the database and updated `database_id` in `wrangler.toml`

### "Binding 'DB' not found"

**Solution**: Make sure `wrangler.toml` has the correct `[[d1_databases]]` section

### "Module not found: hono"

**Solution**: Install dependencies:
```bash
npm install hono @hono/clerk-auth
```

### "Type error: D1Database"

**Solution**: Install types:
```bash
npm install -D @cloudflare/workers-types
```

## Quick Reference

### View Database Content

```bash
# List tables
wrangler d1 execute cad-engine-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# View users
wrangler d1 execute cad-engine-db --command "SELECT * FROM users"

# View projects
wrangler d1 execute cad-engine-db --command "SELECT * FROM projects"

# Count records
wrangler d1 execute cad-engine-db --command "SELECT COUNT(*) as count FROM projects"
```

### View R2 Contents

```bash
# List buckets
wrangler r2 bucket list

# List objects in bucket
wrangler r2 object list cad-engine-files

# View specific object
wrangler r2 object get cad-engine-files/projects/some-id/model.json
```

### View Secrets

```bash
# List secret names (not values)
wrangler secret list
```

### View Logs

```bash
# Tail live logs
wrangler tail

# View recent deployments
wrangler deployments list
```

## Current Configuration

**wrangler.toml**:
- ✅ Entry point: `src/index.ts`
- ✅ Clerk Publishable Key: configured in `[vars]`
- ⚠️ Database ID: needs to be updated after creation
- ✅ R2 binding: configured

**Environment Variables**:
- `CLERK_PUBLISHABLE_KEY`: In wrangler.toml (public)
- `CLERK_SECRET_KEY`: Set via wrangler secret (secure)
- `ENVIRONMENT`: production

**Bindings**:
- `c.env.DB` - D1 Database
- `c.env.STORAGE` - R2 Bucket
- `c.env.CLERK_PUBLISHABLE_KEY` - From [vars]
- `c.env.CLERK_SECRET_KEY` - From secret

## Next Steps

1. Complete setup steps above
2. Deploy backend: `wrangler deploy`
3. Get Worker URL
4. Update frontend `NEXT_PUBLIC_API_URL`
5. Test authentication flow
6. Connect CAD engine service

---

**All configuration files are ready. Just run the setup steps above!**
