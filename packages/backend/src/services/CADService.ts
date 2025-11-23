import type {
  CreateBoxInput,
  CreateCylinderInput,
  CreateSphereInput,
  ExtrudeInput,
  CutInput,
  FilletInput,
  ChamferInput,
  ExportInput,
} from '../validation/cad.js';
import { pythonCADClient } from './PythonCADClient.js';

/**
 * CAD Service for geometry operations
 * Proxies requests to Python FastAPI CAD engine
 */
export class CADService {
  /**
   * Create a box primitive
   */
  async createBox(input: CreateBoxInput) {
    try {
      const result = await pythonCADClient.createBox({
        width: input.width,
        height: input.height,
        depth: input.depth,
        position: input.position,
      });

      return {
        feature_id: result.feature_id,
        type: result.type,
        parameters: result.parameters,
        geometry: result.geometry,
      };
    } catch (error) {
      console.error('Failed to create box:', error);
      throw new Error(`Failed to create box: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a cylinder primitive
   */
  async createCylinder(input: CreateCylinderInput) {
    try {
      const result = await pythonCADClient.createCylinder({
        radius: input.radius,
        height: input.height,
        position: input.position,
      });

      return {
        feature_id: result.feature_id,
        type: result.type,
        parameters: result.parameters,
        geometry: result.geometry,
      };
    } catch (error) {
      console.error('Failed to create cylinder:', error);
      throw new Error(`Failed to create cylinder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a sphere primitive
   */
  async createSphere(input: CreateSphereInput) {
    try {
      const result = await pythonCADClient.createSphere({
        radius: input.radius,
        position: input.position,
      });

      return {
        feature_id: result.feature_id,
        type: result.type,
        parameters: result.parameters,
        geometry: result.geometry,
      };
    } catch (error) {
      console.error('Failed to create sphere:', error);
      throw new Error(`Failed to create sphere: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extrude a sketch
   */
  async extrude(input: ExtrudeInput) {
    try {
      const result = await pythonCADClient.extrude({
        sketch_data: input.sketchData || {},
        distance: input.distance,
        direction: input.direction,
      });

      return {
        feature_id: result.feature_id || `extrude-${Date.now()}`,
        type: 'extrude',
        parameters: {
          sketchId: input.sketchId,
          distance: input.distance,
          direction: input.direction,
        },
        geometry: result.geometry || {},
      };
    } catch (error) {
      console.error('Failed to extrude:', error);
      throw new Error(`Failed to extrude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform a cut operation
   */
  async cut(input: CutInput) {
    // Note: Cut operation needs to be implemented in Python CAD engine
    // For now, return a placeholder
    return {
      feature_id: `cut-${Date.now()}`,
      type: 'cut',
      parameters: {
        sketchId: input.sketchId,
        depth: input.depth,
        cutType: input.cutType,
      },
      geometry: {
        vertices: [],
        indices: [],
        normals: [],
        vertex_count: 0,
        triangle_count: 0,
      },
    };
  }

  /**
   * Apply fillet to edges
   */
  async fillet(input: FilletInput) {
    try {
      const result = await pythonCADClient.fillet({
        geometry: input.geometry || {},
        edges: input.edgeIds,
        radius: input.radius,
      });

      return {
        feature_id: result.feature_id || `fillet-${Date.now()}`,
        type: 'fillet',
        parameters: {
          edgeIds: input.edgeIds,
          radius: input.radius,
        },
        geometry: result.geometry || {},
      };
    } catch (error) {
      console.error('Failed to create fillet:', error);
      throw new Error(`Failed to create fillet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply chamfer to edges
   */
  async chamfer(input: ChamferInput) {
    // Note: Chamfer operation needs to be implemented in Python CAD engine
    // For now, return a placeholder
    return {
      feature_id: `chamfer-${Date.now()}`,
      type: 'chamfer',
      parameters: {
        edgeIds: input.edgeIds,
        distance: input.distance,
        angle: input.angle,
      },
      geometry: {
        vertices: [],
        indices: [],
        normals: [],
        vertex_count: 0,
        triangle_count: 0,
      },
    };
  }

  /**
   * Export geometry to various formats
   */
  async export(input: ExportInput) {
    try {
      const result = await pythonCADClient.export({
        geometry: input.geometry || {},
        format: input.format,
        filename: input.filename,
      });

      return {
        projectId: input.projectId,
        format: input.format.toUpperCase(),
        url: result.download_url || `/exports/${input.projectId}.${input.format}`,
        size: result.file_size || 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        options: input.options,
        created: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to export:', error);
      throw new Error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const cadService = new CADService();
