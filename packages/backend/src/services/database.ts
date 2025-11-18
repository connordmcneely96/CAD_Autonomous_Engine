import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Prisma Client configuration with logging and error handling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'colorless',
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

export { prisma };

// Database service class with helper methods
export class DatabaseService {
  private client: PrismaClient;

  constructor() {
    this.client = prisma;
  }

  /**
   * Get the Prisma client instance
   */
  getClient(): PrismaClient {
    return this.client;
  }

  /**
   * Check database connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database metrics
   */
  async getMetrics() {
    try {
      const [userCount, projectCount, versionCount, commentCount, feaJobCount] =
        await Promise.all([
          this.client.user.count(),
          this.client.project.count(),
          this.client.version.count(),
          this.client.comment.count(),
          this.client.fEAJob.count(),
        ]);

      return {
        users: userCount,
        projects: projectCount,
        versions: versionCount,
        comments: commentCount,
        feaJobs: feaJobCount,
      };
    } catch (error) {
      console.error('Error fetching database metrics:', error);
      throw error;
    }
  }

  /**
   * Safely disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  /**
   * User helper methods
   */
  async findUserByEmail(email: string) {
    return this.client.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string) {
    return this.client.user.findUnique({
      where: { id },
      include: {
        projects: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return this.client.user.create({
      data,
    });
  }

  /**
   * Project helper methods
   */
  async findProjectById(id: string) {
    return this.client.project.findUnique({
      where: { id },
      include: {
        user: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        projectShares: {
          include: { user: true },
        },
      },
    });
  }

  async findProjectsByUserId(userId: string) {
    return this.client.project.findMany({
      where: { userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findPublicProjects(limit = 20, offset = 0) {
    return this.client.project.findMany({
      where: { isPublic: true },
      include: {
        user: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(data: Prisma.ProjectCreateInput) {
    return this.client.project.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async updateProject(id: string, data: Prisma.ProjectUpdateInput) {
    return this.client.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: string) {
    return this.client.project.delete({
      where: { id },
    });
  }

  /**
   * Version helper methods
   */
  async createVersion(data: Prisma.VersionCreateInput) {
    return this.client.version.create({
      data,
    });
  }

  async findVersionsByProjectId(projectId: string) {
    return this.client.version.findMany({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Comment helper methods
   */
  async createComment(data: Prisma.CommentCreateInput) {
    return this.client.comment.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async updateComment(id: string, data: Prisma.CommentUpdateInput) {
    return this.client.comment.update({
      where: { id },
      data,
    });
  }

  async deleteComment(id: string) {
    return this.client.comment.delete({
      where: { id },
    });
  }

  /**
   * Project Share helper methods
   */
  async shareProject(
    projectId: string,
    userId: string,
    role: 'OWNER' | 'EDITOR' | 'VIEWER'
  ) {
    return this.client.projectShare.create({
      data: {
        projectId,
        userId,
        role,
      },
    });
  }

  async updateProjectShare(
    projectId: string,
    userId: string,
    role: 'OWNER' | 'EDITOR' | 'VIEWER'
  ) {
    return this.client.projectShare.update({
      where: {
        projectId_userId: { projectId, userId },
      },
      data: { role },
    });
  }

  async removeProjectShare(projectId: string, userId: string) {
    return this.client.projectShare.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
  }

  /**
   * FEA Job helper methods
   */
  async createFEAJob(data: Prisma.FEAJobCreateInput) {
    return this.client.fEAJob.create({
      data,
    });
  }

  async updateFEAJob(id: string, data: Prisma.FEAJobUpdateInput) {
    return this.client.fEAJob.update({
      where: { id },
      data,
    });
  }

  async findFEAJobsByProjectId(projectId: string) {
    return this.client.fEAJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async findPendingFEAJobs() {
    return this.client.fEAJob.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Export types
export type { Prisma };
