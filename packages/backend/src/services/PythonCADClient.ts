/**
 * Python CAD Engine Client
 *
 * HTTP client for communicating with the Python FastAPI CAD engine
 */

const CAD_ENGINE_URL = process.env.CAD_ENGINE_URL || 'http://localhost:8000';

export class PythonCADClient {
  private baseUrl: string;

  constructor(baseUrl: string = CAD_ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a box primitive
   */
  async createBox(params: {
    width: number;
    height: number;
    depth: number;
    position?: { x: number; y: number; z: number };
  }) {
    const response = await fetch(`${this.baseUrl}/cad/primitives/box`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create box: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Create a cylinder primitive
   */
  async createCylinder(params: {
    radius: number;
    height: number;
    position?: { x: number; y: number; z: number };
    segments?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/cad/primitives/cylinder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        segments: params.segments || 32,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create cylinder: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Create a sphere primitive
   */
  async createSphere(params: {
    radius: number;
    position?: { x: number; y: number; z: number };
    segments?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/cad/primitives/sphere`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        segments: params.segments || 32,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create sphere: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Extrude a sketch
   */
  async extrude(params: {
    sketch_data: any;
    distance: number;
    direction?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/cad/operations/extrude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        direction: params.direction || 'normal',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to extrude: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Apply fillet to edges
   */
  async fillet(params: {
    geometry: any;
    edges: number[];
    radius: number;
  }) {
    const response = await fetch(`${this.baseUrl}/cad/operations/fillet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create fillet: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Export geometry
   */
  async export(params: {
    geometry: any;
    format: string;
    filename?: string;
    ascii_mode?: boolean;
  }) {
    const response = await fetch(`${this.baseUrl}/cad/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        ascii_mode: params.ascii_mode || false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to export: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get CAD engine status
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/cad/info`);

      if (!response.ok) {
        return {
          available: false,
          error: 'CAD engine not available',
        };
      }

      const result = await response.json();
      return {
        available: true,
        ...result.data,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const pythonCADClient = new PythonCADClient();
