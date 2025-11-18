import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { projectRoutes } from './routes/projects.js';
import { cadRoutes } from './routes/cad.js';
import { aiRoutes } from './routes/ai.js';
import { handleError } from './utils/errors.js';

const fastify = Fastify({
  logger: {
    level: config.logging.level,
    transport:
      config.env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Register plugins
await fastify.register(cors, {
  origin: config.corsOrigin,
  credentials: true,
});

await fastify.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  handleError(error, reply);
});

// Register routes
await fastify.register(healthRoutes);
await fastify.register(projectRoutes, { prefix: '/api/projects' });
await fastify.register(cadRoutes, { prefix: '/api/cad' });
await fastify.register(aiRoutes, { prefix: '/api/ai' });

// Root route
fastify.get('/', async () => {
  return {
    name: 'CAD Autonomous Engine - Backend API',
    version: '0.1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      projects: '/api/projects',
      cad: '/api/cad',
      ai: '/api/ai',
    },
  };
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, starting graceful shutdown...`);
    await fastify.close();
    process.exit(0);
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    });
    fastify.log.info(`Server is running on http://${config.host}:${config.port}`);
    fastify.log.info('API Documentation:');
    fastify.log.info('  - Health Check: GET /health');
    fastify.log.info('  - Projects API: /api/projects');
    fastify.log.info('  - CAD Operations: /api/cad');
    fastify.log.info('  - AI Commands: /api/ai');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
