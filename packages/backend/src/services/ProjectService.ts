import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
  CreateVersionInput,
} from '../validation/project.js';
import type { PaginatedResponse } from '../types/index.js';

export class ProjectService {
  /**
   * List projects with pagination and filtering
   */
  async listProjects(
    userId: string,
    query: ListProjectsQuery
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, search, isPublic, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [{ userId }, { isPublic: true }],
    };

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        currentVersion: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            versions: true,
            comments: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: projects,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            versions: true,
            comments: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    // Check access permissions
    if (!project.isPublic && project.userId !== userId) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return project;
  }

  /**
   * Create a new project
   */
  async createProject(userId: string, input: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        isPublic: input.isPublic || false,
        currentVersion: 1,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
    // Check if project exists and user owns it
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundError('Project', projectId);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this project');
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string) {
    // Check if project exists and user owns it
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundError('Project', projectId);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this project');
    }

    // Delete project (cascade delete will handle related records)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return { id: projectId };
  }

  /**
   * List project versions
   */
  async listVersions(projectId: string, userId: string) {
    // Check access to project
    await this.getProject(projectId, userId);

    const versions = await prisma.version.findMany({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });

    return versions;
  }

  /**
   * Create a new version snapshot
   */
  async createVersion(projectId: string, userId: string, input: CreateVersionInput) {
    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, currentVersion: true },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    if (project.userId !== userId) {
      throw new ForbiddenError('You do not have permission to create versions for this project');
    }

    // Create new version
    const newVersionNumber = project.currentVersion + 1;

    const version = await prisma.version.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        name: input.name,
        description: input.description,
        featureTree: input.featureTree,
      },
    });

    // Update project's current version
    await prisma.project.update({
      where: { id: projectId },
      data: { currentVersion: newVersionNumber },
    });

    return version;
  }

  /**
   * Get a specific version
   */
  async getVersion(projectId: string, versionNumber: number, userId: string) {
    // Check access to project
    await this.getProject(projectId, userId);

    const version = await prisma.version.findFirst({
      where: {
        projectId,
        versionNumber,
      },
    });

    if (!version) {
      throw new NotFoundError('Version', `${projectId}:${versionNumber}`);
    }

    return version;
  }
}

export const projectService = new ProjectService();
