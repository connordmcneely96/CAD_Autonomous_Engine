import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'healthy',
      service: 'backend-api',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
    });
  });

  fastify.get('/health/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Add database and other service checks here
    const isReady = true; // Placeholder

    if (isReady) {
      return reply.status(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      return reply.status(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
      });
    }
  });

  fastify.get('/health/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });
}
