import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { handleError, successResponse } from '../utils/errors.js';

/**
 * AI Service Proxy Routes
 * Base path: /api/ai
 *
 * These endpoints proxy requests to the Python AI service
 * with authentication and rate limiting
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Rate limiting map: userId -> { count, resetTime }
 */
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Rate limit: 10 requests per minute per user
 */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function aiRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  /**
   * POST /api/ai/command
   * Process natural language CAD command
   *
   * @example
   * POST /api/ai/command
   * {
   *   "command": "Create a 50mm cube",
   *   "context": {
   *     "project_id": "proj-123",
   *     "selected_features": ["box-1"]
   *   }
   * }
   */
  fastify.post('/command', async (request, reply) => {
    try {
      const userId = request.user!.id;

      // Check rate limit
      if (!checkRateLimit(userId)) {
        return reply.code(429).send({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many AI requests. Please wait a minute and try again.',
          },
        });
      }

      const body = request.body as {
        command: string;
        context?: Record<string, any>;
      };

      // Validate input
      if (!body.command || typeof body.command !== 'string') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_COMMAND',
            message: 'Command is required and must be a string',
          },
        });
      }

      // Log AI interaction
      fastify.log.info({
        userId,
        command: body.command,
        context: body.context,
        timestamp: new Date().toISOString(),
      }, 'AI command received');

      // Forward to AI service
      const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: body.command,
          context: body.context || {},
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        fastify.log.error({
          status: aiResponse.status,
          error: errorText,
        }, 'AI service error');

        return reply.code(aiResponse.status).send({
          success: false,
          error: {
            code: 'AI_SERVICE_ERROR',
            message: 'AI service failed to process command',
            details: errorText,
          },
        });
      }

      const aiData = await aiResponse.json();

      // Log successful response
      fastify.log.info({
        userId,
        operation: aiData.parsed_command?.operation,
        geometry: aiData.parsed_command?.geometry,
        confidence: aiData.parsed_command?.confidence,
      }, 'AI command processed');

      return successResponse(aiData);
    } catch (error) {
      fastify.log.error(error, 'Error in AI command proxy');
      handleError(error as Error, reply);
    }
  });

  /**
   * GET /api/ai/examples
   * Get example commands
   */
  fastify.get('/examples', async (request, reply) => {
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/examples`);

      if (!aiResponse.ok) {
        return reply.code(aiResponse.status).send({
          success: false,
          error: {
            code: 'AI_SERVICE_ERROR',
            message: 'Failed to fetch examples',
          },
        });
      }

      const examples = await aiResponse.json();
      return successResponse(examples);
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * GET /api/ai/status
   * Get AI service status
   */
  fastify.get('/status', async (request, reply) => {
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/status`);

      if (!aiResponse.ok) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI service is not available',
          },
        });
      }

      const status = await aiResponse.json();
      return successResponse(status);
    } catch (error) {
      return reply.code(503).send({
        success: false,
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'AI service is not reachable',
          details: (error as Error).message,
        },
      });
    }
  });
}
