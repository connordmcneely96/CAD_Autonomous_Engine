/**
 * Mock CAD Client
 *
 * Returns hardcoded geometry for frontend development without backend.
 * Simulates the CAD engine API responses.
 */

import type { ParsedCommand } from './ai-client';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Geometry {
  vertices: number[];
  indices: number[];
  normals: number[];
  vertex_count: number;
  triangle_count: number;
}

interface CADFeature {
  feature_id: string;
  type: string;
  parameters: Record<string, any>;
  geometry: Geometry;
}

/**
 * Generate a mock box geometry
 */
function generateBoxGeometry(width: number, height: number, depth: number): Geometry {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  // 24 vertices (4 per face * 6 faces)
  const vertices = [
    // Front face
    -w, -h, d,   w, -h, d,   w, h, d,  -w, h, d,
    // Back face
    -w, -h, -d,  -w, h, -d,  w, h, -d,  w, -h, -d,
    // Top face
    -w, h, -d,   -w, h, d,   w, h, d,   w, h, -d,
    // Bottom face
    -w, -h, -d,  w, -h, -d,  w, -h, d,  -w, -h, d,
    // Right face
    w, -h, -d,   w, h, -d,   w, h, d,   w, -h, d,
    // Left face
    -w, -h, -d,  -w, -h, d,  -w, h, d,  -w, h, -d,
  ];

  const indices = [
    0, 1, 2,  0, 2, 3,     // Front
    4, 5, 6,  4, 6, 7,     // Back
    8, 9, 10, 8, 10, 11,   // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23, // Left
  ];

  const normals = [
    // Front
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Back
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    // Top
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Bottom
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
    // Right
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Left
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
  ];

  return {
    vertices,
    indices,
    normals,
    vertex_count: 24,
    triangle_count: 12,
  };
}

/**
 * Generate a mock cylinder geometry
 */
function generateCylinderGeometry(radius: number, height: number, segments: number = 32): Geometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const h = height / 2;

  // Generate vertices for sides
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    // Bottom vertex
    vertices.push(x, -h, z);
    normals.push(x / radius, 0, z / radius);

    // Top vertex
    vertices.push(x, h, z);
    normals.push(x / radius, 0, z / radius);
  }

  // Center vertices for caps
  const bottomCenter = vertices.length / 3;
  vertices.push(0, -h, 0);
  normals.push(0, -1, 0);

  const topCenter = vertices.length / 3;
  vertices.push(0, h, 0);
  normals.push(0, 1, 0);

  // Generate indices
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const bottomCurr = i * 2;
    const topCurr = i * 2 + 1;
    const bottomNext = next * 2;
    const topNext = next * 2 + 1;

    // Side faces
    indices.push(bottomCurr, topCurr, bottomNext);
    indices.push(bottomNext, topCurr, topNext);

    // Bottom cap
    indices.push(bottomCenter, bottomNext, bottomCurr);

    // Top cap
    indices.push(topCenter, topCurr, topNext);
  }

  return {
    vertices,
    indices,
    normals,
    vertex_count: vertices.length / 3,
    triangle_count: indices.length / 3,
  };
}

/**
 * Generate a mock sphere geometry
 */
function generateSphereGeometry(radius: number, segments: number = 32): Geometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const rings = Math.floor(segments / 2);

  // Generate vertices
  for (let ring = 0; ring <= rings; ring++) {
    const phi = (Math.PI * ring) / rings;
    for (let seg = 0; seg < segments; seg++) {
      const theta = (2 * Math.PI * seg) / segments;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      vertices.push(x, y, z);
      normals.push(x / radius, y / radius, z / radius);
    }
  }

  // Generate indices
  for (let ring = 0; ring < rings; ring++) {
    for (let seg = 0; seg < segments; seg++) {
      const current = ring * segments + seg;
      const next = ring * segments + ((seg + 1) % segments);
      const nextRing = (ring + 1) * segments + seg;
      const nextRingNext = (ring + 1) * segments + ((seg + 1) % segments);

      indices.push(current, nextRing, next);
      indices.push(next, nextRing, nextRingNext);
    }
  }

  return {
    vertices,
    indices,
    normals,
    vertex_count: vertices.length / 3,
    triangle_count: indices.length / 3,
  };
}

/**
 * Mock CAD API
 */
export const mockCAD = {
  /**
   * Create a box
   */
  createBox(width: number, height: number, depth: number, position?: Position): CADFeature {
    return {
      feature_id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'box',
      parameters: {
        width,
        height,
        depth,
        position: position || { x: 0, y: 0, z: 0 },
      },
      geometry: generateBoxGeometry(width, height, depth),
    };
  },

  /**
   * Create a cylinder
   */
  createCylinder(radius: number, height: number, position?: Position, segments?: number): CADFeature {
    return {
      feature_id: `cylinder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'cylinder',
      parameters: {
        radius,
        height,
        position: position || { x: 0, y: 0, z: 0 },
        segments: segments || 32,
      },
      geometry: generateCylinderGeometry(radius, height, segments),
    };
  },

  /**
   * Create a sphere
   */
  createSphere(radius: number, position?: Position, segments?: number): CADFeature {
    return {
      feature_id: `sphere-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'sphere',
      parameters: {
        radius,
        position: position || { x: 0, y: 0, z: 0 },
        segments: segments || 32,
      },
      geometry: generateSphereGeometry(radius, segments),
    };
  },

  /**
   * Mock AI command - returns mock geometry based on command
   */
  async processAICommand(command: string): Promise<{
    success: boolean;
    parsed_command: ParsedCommand;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lowerCommand = command.toLowerCase();

    // Parse basic commands
    let geometry: 'box' | 'cylinder' | 'sphere' | 'hole' | 'fillet' | 'chamfer' | 'extrude' | 'cut' = 'box';
    let parameters: Record<string, any> = {};

    if (lowerCommand.includes('cylinder')) {
      geometry = 'cylinder';
      const radiusMatch = lowerCommand.match(/radius\s*(\d+)/);
      const heightMatch = lowerCommand.match(/height\s*(\d+)/);
      parameters = {
        radius: radiusMatch ? parseInt(radiusMatch[1]) : 10,
        height: heightMatch ? parseInt(heightMatch[1]) : 20,
      };
    } else if (lowerCommand.includes('sphere')) {
      geometry = 'sphere';
      const radiusMatch = lowerCommand.match(/radius\s*(\d+)/);
      parameters = {
        radius: radiusMatch ? parseInt(radiusMatch[1]) : 10,
      };
    } else if (lowerCommand.includes('cube')) {
      geometry = 'box';
      const sizeMatch = lowerCommand.match(/(\d+)\s*mm/);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 50;
      parameters = {
        width: size,
        height: size,
        depth: size,
      };
    } else if (lowerCommand.includes('box')) {
      geometry = 'box';
      const numbers = lowerCommand.match(/(\d+)/g);
      if (numbers && numbers.length >= 3) {
        parameters = {
          width: parseInt(numbers[0]),
          height: parseInt(numbers[1]),
          depth: parseInt(numbers[2]),
        };
      } else {
        parameters = {
          width: 50,
          height: 50,
          depth: 50,
        };
      }
    }

    return {
      success: true,
      parsed_command: {
        operation: 'create' as const,
        geometry,
        parameters,
        confidence: 0.85,
      },
    };
  },
};
