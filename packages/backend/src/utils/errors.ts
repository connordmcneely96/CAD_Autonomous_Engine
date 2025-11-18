import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      404,
      'NOT_FOUND',
      id ? `${resource} with ID ${id} not found` : `${resource} not found`
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/**
 * Global error handler for Fastify
 */
export function handleError(error: Error, reply: FastifyReply): void {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      reply.code(409).send({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A record with this data already exists',
          details: prismaError.meta,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }

  // Generic 500 error for unexpected errors
  console.error('Unhandled error:', error);
  reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, meta?: any) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}
