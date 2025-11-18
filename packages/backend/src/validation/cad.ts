import { z } from 'zod';

// Vector3D for positions
export const Vector3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export type Vector3D = z.infer<typeof Vector3DSchema>;

// Create Box Primitive
export const CreateBoxSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  position: Vector3DSchema.optional(),
});

export type CreateBoxInput = z.infer<typeof CreateBoxSchema>;

// Create Cylinder Primitive
export const CreateCylinderSchema = z.object({
  radius: z.number().positive(),
  height: z.number().positive(),
  position: Vector3DSchema.optional(),
});

export type CreateCylinderInput = z.infer<typeof CreateCylinderSchema>;

// Create Sphere Primitive
export const CreateSphereSchema = z.object({
  radius: z.number().positive(),
  position: Vector3DSchema.optional(),
});

export type CreateSphereInput = z.infer<typeof CreateSphereSchema>;

// Extrude Operation
export const ExtrudeSchema = z.object({
  sketchId: z.string(),
  distance: z.number(),
  direction: z.enum(['normal', 'reversed', 'symmetric']).default('normal'),
});

export type ExtrudeInput = z.infer<typeof ExtrudeSchema>;

// Cut Operation
export const CutSchema = z.object({
  sketchId: z.string(),
  depth: z.number().positive(),
  cutType: z.enum(['through', 'blind', 'upTo']).default('through'),
});

export type CutInput = z.infer<typeof CutSchema>;

// Fillet Operation
export const FilletSchema = z.object({
  edgeIds: z.array(z.string()).min(1, 'At least one edge required'),
  radius: z.number().positive(),
});

export type FilletInput = z.infer<typeof FilletSchema>;

// Chamfer Operation
export const ChamferSchema = z.object({
  edgeIds: z.array(z.string()).min(1, 'At least one edge required'),
  distance: z.number().positive(),
  angle: z.number().min(0).max(90).default(45),
});

export type ChamferInput = z.infer<typeof ChamferSchema>;

// Export Options
export const ExportFormatSchema = z.enum(['step', 'stl', 'obj', 'iges']);

export const ExportSchema = z.object({
  projectId: z.string(),
  format: ExportFormatSchema,
  options: z
    .object({
      quality: z.enum(['low', 'medium', 'high']).default('medium'),
      includeMetadata: z.boolean().default(true),
    })
    .optional(),
});

export type ExportInput = z.infer<typeof ExportSchema>;
