import { z } from 'zod';

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Project Types
export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  featureTree: z.any().optional(),
  currentVersion: z.number().default(1),
  isPublic: z.boolean().default(false),
  thumbnailUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Version Types
export const VersionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  versionNumber: z.number(),
  name: z.string(),
  description: z.string().optional(),
  featureTree: z.any(),
  createdAt: z.date(),
});

export type Version = z.infer<typeof VersionSchema>;

// Comment Types
export const CommentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  content: z.string(),
  position: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Comment = z.infer<typeof CommentSchema>;

// CAD Feature Types
export const CADFeatureTypeSchema = z.enum([
  'sketch',
  'extrude',
  'cut',
  'fillet',
  'chamfer',
  'hole',
  'shell',
  'pattern',
]);

export type CADFeatureType = z.infer<typeof CADFeatureTypeSchema>;

export const CADFeatureSchema = z.object({
  id: z.string(),
  type: CADFeatureTypeSchema,
  name: z.string(),
  visible: z.boolean(),
  parameters: z.record(z.any()),
  parentId: z.string().optional(),
  children: z.array(z.string()).optional(),
});

export type CADFeature = z.infer<typeof CADFeatureSchema>;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
