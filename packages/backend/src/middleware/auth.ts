import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../types/index.js';

// Extend Fastify request to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

/**
 * Mock authentication middleware
 * In production, this would validate JWT tokens and fetch user from database
 *
 * For now, we'll use a mock user based on Authorization header
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  // Mock JWT validation
  // In production, use jsonwebtoken or @fastify/jwt
  try {
    // For development, accept any token and create a mock user
    // In production, validate the actual JWT token here
    const mockUser: User = {
      id: 'user-' + token.substring(0, 8),
      email: 'demo@example.com',
      name: 'Demo User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Attach user to request
    request.user = mockUser;
  } catch (error) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Validates token if present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const mockUser: User = {
        id: 'user-' + token.substring(0, 8),
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      request.user = mockUser;
    } catch (error) {
      // If token is invalid, continue without user
      // Don't throw error for optional auth
    }
  }
}
