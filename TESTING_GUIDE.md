# Complete Testing Guide - CAD Engine Full Stack

This guide walks you through testing the complete application locally and in production.

## Prerequisites

Before testing, ensure you have:
- ✅ Node.js and pnpm installed
- ✅ Wrangler CLI installed (`npm install -g wrangler`)
- ✅ Cloudflare account
- ✅ Deployed backend (or ready to deploy)

---

## Part 1: Deploy Backend First

### Step 1: Authenticate with Cloudflare

```bash
cd packages/backend
wrangler login
```

This opens a browser window. Click "Allow" to authenticate.

### Step 2: Run Automated Deployment

```bash
./DEPLOY.sh
```

**Expected Output:**
```
✅ Authenticated
✅ Database created with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ wrangler.toml updated
✅ Schema applied successfully
✅ R2 bucket created
✅ Clerk secret set
✅ Worker deployed successfully!
✅ Worker deployed at: https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev
✅ Health check passed
✅ Database connection working
```

**Save your Worker URL!** You'll need it for the next steps.

### Step 3: Test Backend Endpoints

```bash
# Test health endpoint
curl https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/health

# Expected: {"status":"ok","timestamp":"...","environment":"production"}

# Test database connection
curl https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/test-db

# Expected: {"success":true,"result":{"test":1}}
```

If both tests pass, your backend is working! 🎉

---

## Part 2: Test Locally (Recommended First)

### Step 1: Start Backend Locally

```bash
cd packages/backend
wrangler dev
```

This starts a local server at `http://localhost:8787`

**Leave this terminal running** and open a new one.

### Step 2: Verify Local Backend

In a new terminal:

```bash
# Test health
curl http://localhost:8787/health

# Test database
curl http://localhost:8787/test-db
```

Both should return success responses.

### Step 3: Start Frontend Locally

```bash
cd packages/frontend
pnpm dev
```

Frontend will start at `http://localhost:3000`

### Step 4: Test Complete Flow

1. **Open Browser**: `http://localhost:3000`

2. **Sign Up/Sign In**:
   - Click "Sign In" button
   - Create a test account (or sign in with existing)
   - Should redirect to `/projects` page

3. **Create Project**:
   - Click "New Project" button
   - Enter name: "Test Project 1"
   - Enter description: "Testing the API integration"
   - Click "Create Project"
   - Should see success toast notification
   - Should redirect to editor (may show blank/in-progress)

4. **View Projects**:
   - Navigate back to `/projects`
   - Should see "Test Project 1" in the list
   - Shows creation date

5. **Refresh Test**:
   - Refresh the page (F5)
   - Projects should still be there
   - **This proves data is persisted in D1 database!**

6. **Create More Projects**:
   - Create "Test Project 2"
   - Create "Test Project 3"
   - All should appear in the list

7. **Delete Project**:
   - Click "Delete" on "Test Project 2"
   - Confirm deletion
   - Should see success toast
   - Project should disappear from list

8. **Search Test**:
   - Type "Test Project 1" in search box
   - Should filter to show only that project
   - Clear search to see all again

### Step 5: Check Browser Console

Open DevTools (F12) and check:

- **Console Tab**: Should have no errors
- **Network Tab**:
  - Look for requests to `http://localhost:8787/api/projects`
  - Should see 200 status codes
  - Check request headers for `Authorization: Bearer ...`
  - Check response bodies for project data

### Step 6: Verify Database

```bash
cd packages/backend

# Count projects
wrangler d1 execute cad-engine-db --command "SELECT count(*) as project_count FROM projects"

# View all projects
wrangler d1 execute cad-engine-db --command "SELECT id, name, description, created_at FROM projects"

# Check users table
wrangler d1 execute cad-engine-db --command "SELECT id, email, name FROM users"
```

You should see your created projects in the database!

---

## Part 3: Deploy to Production

### Step 1: Update Frontend Environment Variables

**For Production Deployment**, you need to update the API URL to point to your deployed Worker.

#### Option A: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add or update:
   ```
   NEXT_PUBLIC_API_URL=https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev
   ```
5. Click "Save"
6. Redeploy: Deployments → Latest → "Redeploy"

#### Option B: Update .env.local and Deploy

```bash
cd packages/frontend

# Update .env.local (for local testing against production)
echo "NEXT_PUBLIC_API_URL=https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev" >> .env.local
```

### Step 2: Update Backend CORS

Edit `packages/backend/src/index.ts` line 29:

```typescript
// Change from:
origin: (origin) => origin, // Allow all origins for now

// To (replace with your actual Vercel URL):
origin: ['http://localhost:3000', 'https://your-app.vercel.app'],
```

Redeploy backend:

```bash
cd packages/backend
wrangler deploy
```

### Step 3: Update Clerk Allowed Origins

1. Go to: https://dashboard.clerk.com/
2. Select your application
3. Navigate to: **API Keys** → **Advanced** → **Allowed Origins**
4. Add your Vercel URL: `https://your-app.vercel.app`
5. Save changes

### Step 4: Deploy Frontend

```bash
cd packages/frontend
git add .
git commit -m "chore: update API URL for production"
git push

# Vercel should auto-deploy on push to main
# Or manually: vercel --prod
```

### Step 5: Test Production

1. Visit your Vercel URL
2. Go through the same testing flow as local:
   - Sign in
   - Create projects
   - Delete projects
   - Search projects
   - Refresh page (verify persistence)

3. Check browser console for any errors

4. Verify database:
   ```bash
   wrangler d1 execute cad-engine-db --command "SELECT * FROM projects"
   ```

---

## Part 4: Troubleshooting

### Frontend Issues

#### "API URL not set" Error

```bash
cd packages/frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local
# Restart dev server
```

#### "CORS Error" in Browser Console

**Cause**: Backend CORS not allowing your frontend origin

**Fix**:
1. Edit `packages/backend/src/index.ts` line 29
2. Add your frontend URL to the `origin` array
3. Redeploy: `wrangler deploy`

#### "401 Unauthorized" on API Calls

**Cause**: Clerk authentication not working

**Checks**:
1. Verify Clerk publishable key in `.env.local`
2. Check browser network tab for Authorization header
3. Verify `getToken()` is returning a token
4. Check Clerk dashboard for allowed origins

### Backend Issues

#### "Database not found" Error

```bash
# Check database exists
wrangler d1 list

# Should show: cad-engine-db

# Verify database_id in wrangler.toml
cat wrangler.toml | grep database_id
```

#### "Binding 'DB' not found"

**Cause**: Database not properly configured in wrangler.toml

**Fix**:
1. Make sure `wrangler.toml` has correct `database_id`
2. Redeploy: `wrangler deploy`

#### Worker Deployment Fails

```bash
# View detailed logs
wrangler tail

# Check for errors in the output
```

### Data Issues

#### Projects Not Appearing

**Debug Steps**:

1. **Check if API call succeeds**:
   - Open browser DevTools → Network tab
   - Look for `/api/projects` request
   - Check status code (should be 200)
   - Check response body for projects array

2. **Check database**:
   ```bash
   wrangler d1 execute cad-engine-db --command "SELECT * FROM projects"
   ```

3. **Check Worker logs**:
   ```bash
   wrangler tail
   ```
   Then trigger the API call from frontend

#### Projects Disappear on Refresh

**Cause**: Data not actually saved to database

**Check**:
1. Verify database connection: `curl [API_URL]/test-db`
2. Check Worker logs during project creation
3. Query database directly to confirm data

---

## Part 5: Performance Testing

### Load Testing

```bash
# Install hey (HTTP load testing tool)
# macOS: brew install hey
# Linux: go install github.com/rakyll/hey@latest

# Test health endpoint
hey -n 1000 -c 10 https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/health

# Should handle 1000 requests with low latency
```

### Expected Results

- **Latency**: < 100ms for most requests
- **Success Rate**: 100%
- **Errors**: 0

---

## Part 6: Security Testing

### Authentication Tests

1. **Without Token**:
   ```bash
   curl https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/api/projects
   # Expected: 401 Unauthorized
   ```

2. **With Invalid Token**:
   ```bash
   curl -H "Authorization: Bearer invalid-token" \
     https://cad-engine-backend.YOUR-SUBDOMAIN.workers.dev/api/projects
   # Expected: 401 Unauthorized
   ```

3. **With Valid Token**:
   - Get token from browser DevTools → Application → Local Storage
   - Look for Clerk session token
   - Test with: `curl -H "Authorization: Bearer YOUR_TOKEN" ...`
   - Expected: 200 OK with projects

### SQL Injection Test

Try creating a project with SQL injection attempt:

```javascript
// In browser console on /projects page
// This should be safely handled by parameterized queries
const maliciousName = "'; DROP TABLE projects; --"
// Try creating a project with this name
// It should be stored as a literal string, not executed
```

---

## Part 7: Acceptance Criteria

Use this checklist to verify everything works:

### Backend ✅

- [ ] Health endpoint returns 200 OK
- [ ] Database test endpoint returns success
- [ ] Worker URL is accessible
- [ ] CORS configured correctly
- [ ] Authentication working with Clerk
- [ ] D1 database has correct schema
- [ ] R2 bucket created

### Frontend ✅

- [ ] Homepage loads without errors
- [ ] Sign in/sign up redirects work
- [ ] Can create new project
- [ ] Projects list displays correctly
- [ ] Can delete project
- [ ] Search functionality works
- [ ] Projects persist after refresh
- [ ] No console errors
- [ ] API calls include Authorization header

### Integration ✅

- [ ] Frontend successfully calls backend
- [ ] Authentication flows end-to-end
- [ ] Data persists in D1 database
- [ ] CORS allows frontend → backend
- [ ] Clerk auth works with both frontend and backend
- [ ] Production deployment works

---

## Part 8: Next Steps

After testing is complete:

1. **Deploy CAD Engine** (Optional):
   - See `packages/cad-engine/README.md`
   - Deploy to Railway or Fly.io
   - Connect to frontend

2. **Set Up Monitoring**:
   - Use Cloudflare Analytics
   - Set up error tracking (Sentry)
   - Monitor database usage

3. **Optimize Performance**:
   - Add caching where appropriate
   - Optimize queries
   - Add pagination for large datasets

4. **Add Features**:
   - Project sharing
   - Collaboration
   - Version history
   - Export functionality

---

## Quick Commands Reference

```bash
# Backend
cd packages/backend
wrangler login                                # Authenticate
./DEPLOY.sh                                   # Deploy everything
wrangler dev                                  # Local dev server
wrangler deploy                               # Deploy to production
wrangler tail                                 # View logs
wrangler d1 execute cad-engine-db --command  # Query database

# Frontend
cd packages/frontend
pnpm dev                                      # Local dev server
pnpm build                                    # Build for production
pnpm type-check                               # Check TypeScript errors

# Testing
curl http://localhost:8787/health             # Test local backend
curl [WORKER_URL]/health                      # Test production backend
curl [WORKER_URL]/test-db                     # Test database connection
```

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review **DEPLOYMENT_STATUS.md** for current status
3. Check **QUICKSTART.md** for deployment steps
4. View logs: `wrangler tail`
5. Check browser console for errors

---

**Happy Testing! 🚀**
