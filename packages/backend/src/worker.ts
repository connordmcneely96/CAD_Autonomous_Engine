import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';

export type Bindings = {
  DB: D1Database;
  STORAGE: R2Bucket;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());
app.use('*', clerkMiddleware());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/api/projects', async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
  )
    .bind(auth.userId)
    .all();

  return c.json({ projects: results });
});

app.post('/api/projects', async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO projects (id, user_id, name, description) VALUES (?, ?, ?, ?)'
  )
    .bind(id, auth.userId, body.name, body.description)
    .run();

  return c.json({ id, ...body });
});

app.get('/api/projects/:id', async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?'
  )
    .bind(id, auth.userId)
    .first();

  if (!project) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(project);
});

export default app;
