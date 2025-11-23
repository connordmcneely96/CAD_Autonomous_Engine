/**
 * Geometry Loader
 *
 * Converts CAD mesh data from backend to Three.js BufferGeometry
 */

import * as THREE from 'three';
import type { Geometry } from '@/stores/cad-store';

/**
 * Load mesh data and convert to Three.js BufferGeometry
 */
export function loadGeometry(meshData: Geometry): THREE.BufferGeometry {
  try {
    const geometry = new THREE.BufferGeometry();

    // Validate mesh data
    if (!meshData.vertices || meshData.vertices.length === 0) {
      throw new Error('Invalid mesh data: no vertices');
    }

    // Set vertex positions
    const vertices = new Float32Array(meshData.vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Set indices if provided
    if (meshData.indices && meshData.indices.length > 0) {
      const indices = new Uint16Array(meshData.indices);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    // Set normals if provided, otherwise compute them
    if (meshData.normals && meshData.normals.length > 0) {
      const normals = new Float32Array(meshData.normals);
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
      geometry.computeVertexNormals();
    }

    // Compute bounding sphere for frustum culling
    geometry.computeBoundingSphere();

    return geometry;
  } catch (error) {
    console.error('Failed to load geometry:', error);
    // Return a small error indicator geometry (red box)
    const errorGeometry = new THREE.BoxGeometry(1, 1, 1);
    return errorGeometry;
  }
}

/**
 * Update existing geometry with new mesh data
 */
export function updateGeometry(geometry: THREE.BufferGeometry, meshData: Geometry): void {
  try {
    // Update positions
    const vertices = new Float32Array(meshData.vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Update indices
    if (meshData.indices && meshData.indices.length > 0) {
      const indices = new Uint16Array(meshData.indices);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    // Update normals
    if (meshData.normals && meshData.normals.length > 0) {
      const normals = new Float32Array(meshData.normals);
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
      geometry.computeVertexNormals();
    }

    // Mark for update
    geometry.attributes.position.needsUpdate = true;
    if (geometry.index) {
      geometry.index.needsUpdate = true;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.needsUpdate = true;
    }

    // Recompute bounding sphere
    geometry.computeBoundingSphere();
  } catch (error) {
    console.error('Failed to update geometry:', error);
  }
}

/**
 * Dispose of geometry to free GPU memory
 */
export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose();
}
