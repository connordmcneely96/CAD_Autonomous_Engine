/**
 * CAD Engine Backend API - Cloudflare Workers
 *
 * Built with:
 * - Hono (web framework)
 * - Cloudflare D1 (database)
 * - Cloudflare R2 (file storage)
 * - Clerk (authentication)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'

// Cloudflare Workers environment bindings
type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  ENVIRONMENT: string
}

// Hono app with typed bindings
const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware
app.use('*', cors({
  origin: (origin) => origin, // Allow all origins for now
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Clerk authentication middleware
app.use('*', clerkMiddleware())

// Health check endpoint (public)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  })
})

// Test database connection
app.get('/test-db', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first()
    return c.json({ success: true, result })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ========================================
// PROJECTS API
// ========================================

// Get all projects for authenticated user
app.get('/api/projects', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, description, thumbnail_url, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(auth.userId).all()

    return c.json({ projects: results })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

// Get single project by ID
app.get('/api/projects/:id', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  try {
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?'
    ).bind(id, auth.userId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // Parse JSON data field
    if (project.data) {
      project.data = JSON.parse(project.data as string)
    }

    return c.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// Create new project
app.post('/api/projects', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { name, description, data } = body

    if (!name) {
      return c.json({ error: 'Project name is required' }, 400)
    }

    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(
      'INSERT INTO projects (id, user_id, name, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      auth.userId,
      name,
      description || null,
      data ? JSON.stringify(data) : null,
      now,
      now
    ).run()

    return c.json({
      id,
      name,
      description,
      data,
      created_at: now,
      updated_at: now
    }, 201)
  } catch (error) {
    console.error('Error creating project:', error)
    return c.json({ error: 'Failed to create project' }, 500)
  }
})

// Update project
app.put('/api/projects/:id', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  try {
    // Check ownership
    const existing = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).bind(id, auth.userId).first()

    if (!existing) {
      return c.json({ error: 'Project not found' }, 404)
    }

    const body = await c.req.json()
    const { name, description, data, thumbnail_url } = body
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(
      'UPDATE projects SET name = ?, description = ?, data = ?, thumbnail_url = ?, updated_at = ? WHERE id = ?'
    ).bind(
      name,
      description || null,
      data ? JSON.stringify(data) : null,
      thumbnail_url || null,
      now,
      id
    ).run()

    return c.json({ success: true, updated_at: now })
  } catch (error) {
    console.error('Error updating project:', error)
    return c.json({ error: 'Failed to update project' }, 500)
  }
})

// Delete project
app.delete('/api/projects/:id', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  try {
    // Check ownership
    const existing = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).bind(id, auth.userId).first()

    if (!existing) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // Delete project and related data
    await c.env.DB.prepare('DELETE FROM features WHERE project_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM versions WHERE project_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return c.json({ error: 'Failed to delete project' }, 500)
  }
})

// ========================================
// FEATURES API (CAD Operations)
// ========================================

// Get features for a project
app.get('/api/projects/:projectId/features', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const projectId = c.req.param('projectId')

  try {
    // Verify ownership
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).bind(projectId, auth.userId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM features WHERE project_id = ? ORDER BY order_index ASC'
    ).bind(projectId).all()

    // Parse JSON parameters
    const features = results.map(f => ({
      ...f,
      parameters: JSON.parse(f.parameters as string)
    }))

    return c.json({ features })
  } catch (error) {
    console.error('Error fetching features:', error)
    return c.json({ error: 'Failed to fetch features' }, 500)
  }
})

// Add feature to project
app.post('/api/projects/:projectId/features', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const projectId = c.req.param('projectId')

  try {
    // Verify ownership
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).bind(projectId, auth.userId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    const body = await c.req.json()
    const { type, parameters, parent_id, order_index } = body

    if (!type || !parameters) {
      return c.json({ error: 'Type and parameters are required' }, 400)
    }

    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(
      'INSERT INTO features (id, project_id, type, parameters, parent_id, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      projectId,
      type,
      JSON.stringify(parameters),
      parent_id || null,
      order_index || 0,
      now
    ).run()

    return c.json({
      id,
      project_id: projectId,
      type,
      parameters,
      parent_id,
      order_index,
      created_at: now
    }, 201)
  } catch (error) {
    console.error('Error creating feature:', error)
    return c.json({ error: 'Failed to create feature' }, 500)
  }
})

// ========================================
// FILE STORAGE API (R2)
// ========================================

// Upload file to R2
app.post('/api/upload/:projectId/:filename', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const projectId = c.req.param('projectId')
  const filename = c.req.param('filename')

  try {
    // Verify project ownership
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).bind(projectId, auth.userId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // Get file from request
    const blob = await c.req.blob()

    // Upload to R2
    const key = `projects/${projectId}/${filename}`
    await c.env.STORAGE.put(key, blob, {
      httpMetadata: {
        contentType: blob.type,
      },
    })

    return c.json({
      success: true,
      key,
      url: `https://your-r2-bucket.com/${key}`
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return c.json({ error: 'Failed to upload file' }, 500)
  }
})

// Download file from R2
app.get('/api/download/:projectId/:filename', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const projectId = c.req.param('projectId')
  const filename = c.req.param('filename')

  try {
    // Verify project ownership
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).bind(projectId, auth.userId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // Get file from R2
    const key = `projects/${projectId}/${filename}`
    const object = await c.env.STORAGE.get(key)

    if (!object) {
      return c.json({ error: 'File not found' }, 404)
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return c.json({ error: 'Failed to download file' }, 500)
  }
})

// ========================================
// USER API
// ========================================

// Get or create user (called after Clerk auth)
app.post('/api/users/sync', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { email, name, avatar_url } = body

    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(auth.userId).first()

    if (existing) {
      // Update existing user
      const now = Math.floor(Date.now() / 1000)
      await c.env.DB.prepare(
        'UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
      ).bind(email, name, avatar_url, now, auth.userId).run()

      return c.json({ user: { id: auth.userId, email, name, avatar_url } })
    } else {
      // Create new user
      const now = Math.floor(Date.now() / 1000)
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(auth.userId, email, name, avatar_url, now, now).run()

      return c.json({
        user: {
          id: auth.userId,
          email,
          name,
          avatar_url,
          created_at: now
        }
      }, 201)
    }
  } catch (error) {
    console.error('Error syncing user:', error)
    return c.json({ error: 'Failed to sync user' }, 500)
  }
})

// Export the Hono app as default
export default app
