import { z } from 'zod';

// Create Project
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional().default(false),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// Update Project
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  featureTree: z.any().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// Create Version
export const CreateVersionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  featureTree: z.any(),
});

export type CreateVersionInput = z.infer<typeof CreateVersionSchema>;

// List Projects Query
export const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;

// Project ID Param
export const ProjectIdParamSchema = z.object({
  id: z.string().uuid('Invalid project ID format'),
});

export type ProjectIdParam = z.infer<typeof ProjectIdParamSchema>;
