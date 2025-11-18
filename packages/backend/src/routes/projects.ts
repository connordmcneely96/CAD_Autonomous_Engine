import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { projectService } from '../services/ProjectService.js';
import { handleError, successResponse } from '../utils/errors.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ListProjectsQuerySchema,
  CreateVersionSchema,
  ProjectIdParamSchema,
} from '../validation/project.js';

/**
 * Project routes
 * Base path: /api/projects
 */
export async function projectRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  /**
   * GET /api/projects
   * List user's projects with pagination and filtering
   */
  fastify.get('/', async (request, reply) => {
    try {
      const query = ListProjectsQuerySchema.parse(request.query);
      const userId = request.user!.id;

      const result = await projectService.listProjects(userId, query);

      return successResponse(result, {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      });
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * GET /api/projects/:id
   * Get project details
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = ProjectIdParamSchema.parse(request.params);
      const userId = request.user!.id;

      const project = await projectService.getProject(id, userId);

      return successResponse(project);
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/projects
   * Create a new project
   */
  fastify.post('/', async (request, reply) => {
    try {
      const input = CreateProjectSchema.parse(request.body);
      const userId = request.user!.id;

      const project = await projectService.createProject(userId, input);

      return reply.code(201).send(successResponse(project));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * PATCH /api/projects/:id
   * Update a project
   */
  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = ProjectIdParamSchema.parse(request.params);
      const input = UpdateProjectSchema.parse(request.body);
      const userId = request.user!.id;

      const project = await projectService.updateProject(id, userId, input);

      return successResponse(project);
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * DELETE /api/projects/:id
   * Delete a project
   */
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = ProjectIdParamSchema.parse(request.params);
      const userId = request.user!.id;

      await projectService.deleteProject(id, userId);

      return reply.code(204).send();
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * GET /api/projects/:id/versions
   * List project versions
   */
  fastify.get<{ Params: { id: string } }>('/:id/versions', async (request, reply) => {
    try {
      const { id } = ProjectIdParamSchema.parse(request.params);
      const userId = request.user!.id;

      const versions = await projectService.listVersions(id, userId);

      return successResponse(versions);
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * POST /api/projects/:id/versions
   * Create a new version snapshot
   */
  fastify.post<{ Params: { id: string } }>('/:id/versions', async (request, reply) => {
    try {
      const { id } = ProjectIdParamSchema.parse(request.params);
      const input = CreateVersionSchema.parse(request.body);
      const userId = request.user!.id;

      const version = await projectService.createVersion(id, userId, input);

      return reply.code(201).send(successResponse(version));
    } catch (error) {
      handleError(error as Error, reply);
    }
  });

  /**
   * GET /api/projects/:id/versions/:versionNumber
   * Get a specific version
   */
  fastify.get<{ Params: { id: string; versionNumber: string } }>(
    '/:id/versions/:versionNumber',
    async (request, reply) => {
      try {
        const { id } = ProjectIdParamSchema.parse({ id: request.params.id });
        const versionNumber = parseInt(request.params.versionNumber, 10);
        const userId = request.user!.id;

        if (isNaN(versionNumber)) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_VERSION',
              message: 'Version number must be a valid integer',
            },
          });
        }

        const version = await projectService.getVersion(id, versionNumber, userId);

        return successResponse(version);
      } catch (error) {
        handleError(error as Error, reply);
      }
    }
  );
}
