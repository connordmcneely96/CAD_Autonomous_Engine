/**
 * CAD Operations Hook
 *
 * React hook for CAD operations (create primitives, extrude, etc.)
 */

import { useState } from 'react';
import { useCADStore } from '@/stores/cad-store';
import * as cadClient from '@/lib/cad-client';
import { toast } from 'sonner';

export function useCADOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const addFeature = useCADStore((state) => state.addFeature);

  /**
   * Create a box primitive
   */
  const createBox = async (
    width: number,
    height: number,
    depth: number,
    position?: { x: number; y: number; z: number }
  ) => {
    setIsLoading(true);
    try {
      const response = await cadClient.createBox(width, height, depth, position);

      // Add feature to store
      addFeature({
        type: 'sketch',
        name: `Box ${width}×${height}×${depth}`,
        visible: true,
        parameters: response.parameters,
        geometry: response.geometry,
      });

      toast.success('Box created', {
        description: `${width}×${height}×${depth}mm`,
      });

      return response;
    } catch (error) {
      console.error('Failed to create box:', error);
      toast.error('Failed to create box', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a cylinder primitive
   */
  const createCylinder = async (
    radius: number,
    height: number,
    position?: { x: number; y: number; z: number }
  ) => {
    setIsLoading(true);
    try {
      const response = await cadClient.createCylinder(radius, height, position);

      // Add feature to store
      addFeature({
        type: 'sketch',
        name: `Cylinder R${radius} H${height}`,
        visible: true,
        parameters: response.parameters,
        geometry: response.geometry,
      });

      toast.success('Cylinder created', {
        description: `Radius: ${radius}mm, Height: ${height}mm`,
      });

      return response;
    } catch (error) {
      console.error('Failed to create cylinder:', error);
      toast.error('Failed to create cylinder', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a sphere primitive
   */
  const createSphere = async (
    radius: number,
    position?: { x: number; y: number; z: number }
  ) => {
    setIsLoading(true);
    try {
      const response = await cadClient.createSphere(radius, position);

      // Add feature to store
      addFeature({
        type: 'sketch',
        name: `Sphere R${radius}`,
        visible: true,
        parameters: response.parameters,
        geometry: response.geometry,
      });

      toast.success('Sphere created', {
        description: `Radius: ${radius}mm`,
      });

      return response;
    } catch (error) {
      console.error('Failed to create sphere:', error);
      toast.error('Failed to create sphere', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createBox,
    createCylinder,
    createSphere,
  };
}
