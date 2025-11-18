import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { cadService } from '../services/CADService.js';
import { handleError, successResponse } from '../utils/errors.js';
import {
  CreateBoxSchema,
  CreateCylinderSchema,
  CreateSphereSchema,
  ExtrudeSchema,
  CutSchema,
  FilletSchema,
  ChamferSchema,
  ExportSchema,
} from '../validation/cad.js';

/**
 * CAD Operations routes
 * Base path: /api/cad
 *
 * These endpoints currently return mock data
 * Will be integrated with Python CAD engine later
 */
export async function cadRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  /**
   * POST /api/cad/primitives/box
   * Create a box primitive
   *
   * @example
   * POST /api/cad/primitives/box
   * {
   *   "width": 10,
   *   "height": 5,
   *   "depth": 8,
   *   "position": { "x": 0, "y": 0, "z": 0 }
   * }
   */
  fastify.post('/primitives/box', async (request, reply) => {
    try {
      const input = CreateBoxSchema.parse(request.body);
      const result = await cadService.createBox(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/primitives/cylinder
   * Create a cylinder primitive
   *
   * @example
   * POST /api/cad/primitives/cylinder
   * {
   *   "radius": 5,
   *   "height": 10,
   *   "position": { "x": 0, "y": 0, "z": 0 }
   * }
   */
  fastify.post('/primitives/cylinder', async (request, reply) => {
    try {
      const input = CreateCylinderSchema.parse(request.body);
      const result = await cadService.createCylinder(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/primitives/sphere
   * Create a sphere primitive
   *
   * @example
   * POST /api/cad/primitives/sphere
   * {
   *   "radius": 5,
   *   "position": { "x": 0, "y": 0, "z": 0 }
   * }
   */
  fastify.post('/primitives/sphere', async (request, reply) => {
    try {
      const input = CreateSphereSchema.parse(request.body);
      const result = await cadService.createSphere(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/operations/extrude
   * Extrude a sketch
   *
   * @example
   * POST /api/cad/operations/extrude
   * {
   *   "sketchId": "sketch-123",
   *   "distance": 10,
   *   "direction": "normal"
   * }
   */
  fastify.post('/operations/extrude', async (request, reply) => {
    try {
      const input = ExtrudeSchema.parse(request.body);
      const result = await cadService.extrude(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/operations/cut
   * Perform a cut operation
   *
   * @example
   * POST /api/cad/operations/cut
   * {
   *   "sketchId": "sketch-456",
   *   "depth": 5,
   *   "cutType": "through"
   * }
   */
  fastify.post('/operations/cut', async (request, reply) => {
    try {
      const input = CutSchema.parse(request.body);
      const result = await cadService.cut(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/operations/fillet
   * Apply fillet to edges
   *
   * @example
   * POST /api/cad/operations/fillet
   * {
   *   "edgeIds": ["edge-1", "edge-2"],
   *   "radius": 2
   * }
   */
  fastify.post('/operations/fillet', async (request, reply) => {
    try {
      const input = FilletSchema.parse(request.body);
      const result = await cadService.fillet(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/operations/chamfer
   * Apply chamfer to edges
   *
   * @example
   * POST /api/cad/operations/chamfer
   * {
   *   "edgeIds": ["edge-1", "edge-2"],
   *   "distance": 1,
   *   "angle": 45
   * }
   */
  fastify.post('/operations/chamfer', async (request, reply) => {
    try {
      const input = ChamferSchema.parse(request.body);
      const result = await cadService.chamfer(input);

      return reply.code(201).send(successResponse(result));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/cad/export
   * Export geometry to various formats
   *
   * @example
   * POST /api/cad/export
   * {
   *   "projectId": "project-123",
   *   "format": "step",
   *   "options": {
   *     "quality": "high",
   *     "includeMetadata": true
   *   }
   * }
   */
  fastify.post('/export', async (request, reply) => {
    try {
      const input = ExportSchema.parse(request.body);
      const result = await cadService.export(input);

      return successResponse(result);
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * GET /api/cad/status
   * Get CAD engine status
   */
  fastify.get('/status', async (_request, _reply) => {
    return successResponse({
      status: 'operational',
      engine: 'mock',
      version: '0.1.0',
      supportedFormats: ['step', 'stl', 'obj', 'iges'],
      supportedOperations: [
        'box',
        'cylinder',
        'sphere',
        'extrude',
        'cut',
        'fillet',
        'chamfer',
      ],
    });
  });
}
