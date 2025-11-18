# Database Setup Guide

This guide explains how to set up the database for the CAD Autonomous Engine.

## 📊 Database Schema Overview

The application uses **PostgreSQL** as its primary database with **Prisma ORM** for type-safe database access.

### Tables

1. **users** - User accounts
2. **projects** - CAD projects with feature trees
3. **versions** - Version history for projects
4. **comments** - Comments on project features
5. **project_shares** - Project collaboration and permissions
6. **fea_jobs** - Finite Element Analysis jobs and results

## 🚀 Quick Start

### Option 1: Local Development (Docker)

1. **Start PostgreSQL with Docker Compose**
   ```bash
   # From project root
   pnpm docker:up
   ```

2. **Generate Prisma Client**
   ```bash
   cd packages/backend
   pnpm db:generate
   ```

3. **Push schema to database**
   ```bash
   pnpm db:push
   ```

4. **Seed the database**
   ```bash
   pnpm db:seed
   ```

5. **Test the connection**
   ```bash
   pnpm db:test
   ```

### Option 2: Supabase (Recommended for Production)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for setup to complete (~2 minutes)

2. **Get Database Credentials**
   - In Supabase dashboard, go to **Settings** → **Database**
   - Find the **Connection String** (URI format)
   - Copy the connection string (it will look like this):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

3. **Get Supabase API Keys**
   - Go to **Settings** → **API**
   - Copy:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key

4. **Configure Environment Variables**
   ```bash
   cd packages/backend
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```bash
   # Database
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

   # Supabase
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

5. **Run Migrations**
   ```bash
   pnpm db:push
   # or for migration files:
   pnpm db:migrate
   ```

6. **Seed the Database**
   ```bash
   pnpm db:seed
   ```

7. **Initialize Storage Buckets**
   Supabase Storage will be automatically initialized when you start the backend:
   ```bash
   pnpm dev
   ```

## 📝 Database Scripts

All scripts are run from `packages/backend`:

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:push` | Push schema to database (no migrations) |
| `pnpm db:migrate` | Create and apply migration |
| `pnpm db:migrate:deploy` | Apply migrations (production) |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio (GUI) |
| `pnpm db:reset` | Reset database (⚠️ deletes all data) |
| `pnpm db:test` | Test database connection |

## 🗄️ Schema Details

### Users Table

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String?
  avatarUrl  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Fields:**
- `id`: Unique identifier (CUID)
- `email`: User email (unique)
- `name`: User display name
- `avatarUrl`: Profile picture URL
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Projects Table

```prisma
model Project {
  id             String   @id @default(cuid())
  userId         String
  name           String
  description    String?
  thumbnailUrl   String?
  featureTree    Json?
  currentVersion Int      @default(1)
  isPublic       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Fields:**
- `id`: Unique project identifier
- `userId`: Owner's user ID
- `name`: Project name
- `description`: Project description
- `thumbnailUrl`: Preview image URL
- `featureTree`: CAD feature tree (JSON)
- `currentVersion`: Current version number
- `isPublic`: Public/private flag
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Feature Tree Structure:**
```json
{
  "parameters": {
    "width": 100,
    "height": 50
  },
  "features": [
    {
      "id": "feat-1",
      "type": "sketch",
      "name": "Base Sketch",
      "plane": "XY",
      "operations": [...]
    },
    {
      "id": "feat-2",
      "type": "extrude",
      "name": "Body",
      "sketchId": "feat-1",
      "distance": 10
    }
  ]
}
```

### Versions Table

```prisma
model Version {
  id              String   @id @default(cuid())
  projectId       String
  versionNumber   Int
  featureTree     Json
  geometryFileUrl String?
  thumbnailUrl    String?
  message         String?
  createdAt       DateTime @default(now())
  createdBy       String
}
```

**Purpose:** Track project history with version control

### Comments Table

```prisma
model Comment {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  featureId String?
  text      String
  resolved  Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Purpose:** Enable collaboration with feature-level comments

### ProjectShares Table

```prisma
model ProjectShare {
  id        String      @id @default(cuid())
  projectId String
  userId    String
  role      ProjectRole // OWNER, EDITOR, VIEWER
  createdAt DateTime    @default(now())
}
```

**Roles:**
- `OWNER`: Full control, can delete
- `EDITOR`: Can edit and create versions
- `VIEWER`: Read-only access

### FEAJobs Table

```prisma
model FEAJob {
  id          String       @id @default(cuid())
  projectId   String
  userId      String
  status      FEAJobStatus // PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
  config      Json
  results     Json?
  createdAt   DateTime     @default(now())
  completedAt DateTime?
}
```

**Purpose:** Track Finite Element Analysis simulations

**Config Example:**
```json
{
  "analysisType": "static",
  "material": "steel",
  "forces": [...],
  "constraints": [...],
  "meshSize": 5
}
```

**Results Example:**
```json
{
  "maxStress": 45.2,
  "maxDisplacement": 0.023,
  "safetyFactor": 5.5,
  "convergence": true
}
```

## 🔍 Using Prisma Studio

Prisma Studio is a visual database browser:

```bash
cd packages/backend
pnpm db:studio
```

This will open `http://localhost:5555` where you can:
- View all tables and records
- Edit data visually
- Test relationships
- Execute queries

## 🧪 Testing Database Connection

Run the database test script:

```bash
cd packages/backend
pnpm db:test
```

This will:
1. Check database health
2. Fetch metrics
3. Query users and projects
4. Test relationships
5. Verify all tables work correctly

## 📦 Supabase Storage

Supabase provides file storage for:
- **CAD files** (`cad-files` bucket)
- **Thumbnails** (`thumbnails` bucket)
- **Exports** (`exports` bucket)

### Storage API Usage

```typescript
import { storage } from './src/lib/supabase.js';

// Upload CAD file
const { path, url } = await storage.uploadCADFile(
  projectId,
  versionNumber,
  fileBuffer,
  'model.step'
);

// Upload thumbnail
const { path, url } = await storage.uploadThumbnail(
  projectId,
  thumbnailBuffer,
  'thumbnail.png'
);

// Download file
const blob = await storage.downloadCADFile(path);

// Delete project files
await storage.deleteProjectFiles(projectId);

// Get storage stats
const stats = await storage.getStorageStats();
```

## 🔐 Security Considerations

### Database Access

- Use **connection pooling** (handled by Prisma)
- Never expose `SERVICE_ROLE_KEY` to frontend
- Use **Row Level Security (RLS)** in Supabase for additional security

### Supabase RLS Policies (Optional)

Enable RLS on Supabase tables:

```sql
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own projects
CREATE POLICY "Users can read own projects"
ON projects FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (auth.uid()::text = user_id);
```

## 🚨 Common Issues

### Error: "Can't reach database server"

**Solution:** Check DATABASE_URL is correct and database is running
```bash
# For local Docker:
pnpm docker:up

# Test connection:
psql $DATABASE_URL
```

### Error: "Prisma Client not generated"

**Solution:** Generate Prisma Client
```bash
pnpm db:generate
```

### Error: "Migration failed"

**Solution:** Reset database (⚠️ deletes data)
```bash
pnpm db:reset
```

Or manually:
```bash
# Drop all tables
npx prisma migrate reset --skip-seed

# Re-run migrations
pnpm db:migrate
```

### Error: "Supabase storage bucket not found"

**Solution:** Initialize storage buckets
```bash
# Storage buckets are auto-created when backend starts
pnpm dev
```

## 📊 Database Metrics & Monitoring

### View Metrics

```bash
# CLI metrics
pnpm db:test

# Or programmatically:
import { db } from './src/services/database.js';
const metrics = await db.getMetrics();
```

### Supabase Dashboard

Monitor your database in Supabase:
1. Go to your Supabase project
2. Click **Database** → **Tables**
3. View **Table Editor**, **Query Editor**, **Database Logs**

## 🔄 Migrations vs Schema Push

### Use `db:push` when:
- Developing locally
- Rapid prototyping
- Schema changes are frequent

### Use `db:migrate` when:
- Deploying to production
- Need migration history
- Team collaboration (migrations in version control)

### Migration Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma

# 2. Create migration
pnpm db:migrate

# 3. Name your migration
# Migration created: 20240115120000_add_fea_jobs

# 4. Commit migration files to git
git add prisma/migrations
git commit -m "feat: add FEA jobs table"

# 5. Deploy in production
pnpm db:migrate:deploy
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## 🎯 Next Steps

After setting up the database:

1. **Implement Authentication**
   - Use Supabase Auth or custom JWT
   - Add user registration/login endpoints

2. **Create API Routes**
   - Project CRUD operations
   - Version management
   - Comment system

3. **Add Storage Integration**
   - CAD file upload/download
   - Thumbnail generation
   - File management

4. **Implement Real-time Features**
   - Live collaboration with Supabase Realtime
   - Project updates
   - Comment notifications

---

Need help? Check the [README.md](../README.md) or open an issue on GitHub.
