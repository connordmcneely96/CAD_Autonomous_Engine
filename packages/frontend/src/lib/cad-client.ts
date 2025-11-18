/**
 * CAD Engine Client
 *
 * Type-safe client for communicating with the CAD engine via backend proxy
 */

import type { Geometry } from '@/stores/cad-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * CAD feature response from backend
 */
export interface CADFeatureResponse {
  feature_id: string;
  type: string;
  parameters: Record<string, any>;
  geometry: Geometry;
}

/**
 * CAD operation response
 */
export interface CADOperationResponse {
  success: boolean;
  feature?: CADFeatureResponse;
  message?: string;
  error?: string;
}

/**
 * CAD service error
 */
export class CADServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'CADServiceError';
  }
}

/**
 * Create a box primitive
 */
export async function createBox(
  width: number,
  height: number,
  depth: number,
  position?: { x: number; y: number; z: number }
): Promise<CADFeatureResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cad/primitives/box`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        width,
        height,
        depth,
        position: position || { x: 0, y: 0, z: 0 },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new CADServiceError(
        error.message || 'Failed to create box',
        response.status,
        error
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof CADServiceError) {
      throw error;
    }
    throw new CADServiceError(
      error instanceof Error ? error.message : 'Failed to connect to CAD service',
      0,
      error
    );
  }
}

/**
 * Create a cylinder primitive
 */
export async function createCylinder(
  radius: number,
  height: number,
  position?: { x: number; y: number; z: number }
): Promise<CADFeatureResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cad/primitives/cylinder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        radius,
        height,
        position: position || { x: 0, y: 0, z: 0 },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new CADServiceError(
        error.message || 'Failed to create cylinder',
        response.status,
        error
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof CADServiceError) {
      throw error;
    }
    throw new CADServiceError(
      error instanceof Error ? error.message : 'Failed to connect to CAD service',
      0,
      error
    );
  }
}

/**
 * Create a sphere primitive
 */
export async function createSphere(
  radius: number,
  position?: { x: number; y: number; z: number }
): Promise<CADFeatureResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cad/primitives/sphere`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        radius,
        position: position || { x: 0, y: 0, z: 0 },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new CADServiceError(
        error.message || 'Failed to create sphere',
        response.status,
        error
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof CADServiceError) {
      throw error;
    }
    throw new CADServiceError(
      error instanceof Error ? error.message : 'Failed to connect to CAD service',
      0,
      error
    );
  }
}

/**
 * Get CAD engine status
 */
export async function getCADStatus(): Promise<{
  status: string;
  engine_available: boolean;
  capabilities: any;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cad/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new CADServiceError('Failed to fetch CAD status', response.status);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to fetch CAD status:', error);
    return {
      status: 'unknown',
      engine_available: false,
      capabilities: {},
    };
  }
}
