/**
 * Shaft Geometry Generation
 *
 * Generates complete shaft geometry from high-level requirements:
 * - Power transmission
 * - Operating speed
 * - Bearing span and overhang
 *
 * Automatically sizes shaft to meet:
 * - Deflection limits
 * - Critical speed requirements
 * - Stress limits
 * - API 610 / AGMA standards
 *
 * Units: US Customary (inches, pounds, HP, RPM)
 */

import { getMaterialProperties } from '../src/materials';
import { ShaftGeometryParams, ShaftGeometryResult, ShaftFeature } from '../src/types';
import { calculateTorqueFromPower } from './shaft-stress';
import { calculateDiameterForCombinedLoading } from './shaft-stress';
import { calculateRequiredDiameter } from './shaft-deflection';
import { calculateDiameterForCriticalSpeed } from './critical-speed';

/**
 * Generate complete shaft geometry from design requirements
 *
 * This is the main function that combines all calculations to create
 * a complete shaft design that meets all engineering requirements.
 *
 * @param params Design requirements
 * @returns Complete shaft geometry with features
 */
export function generateShaftGeometry(
  params: ShaftGeometryParams
): ShaftGeometryResult {
  const {
    power,
    speed,
    overhang,
    bearingSpan,
    material,
    applicationFactor = 1.5, // Service factor for varying loads
  } = params;

  // =========================================================================
  // Step 1: Calculate Loading
  // =========================================================================

  // Torque from power and speed
  const torque = calculateTorqueFromPower(power, speed);

  // Estimate radial load (for pumps, typical radial load is related to power)
  // This is empirical - actual load should come from hydraulic analysis
  // For centrifugal pumps: F_r ≈ 2.5 × √(HP)  (approximation)
  const radialLoad = 2.5 * Math.sqrt(power) * applicationFactor; // lbf

  // Bending moment at overhang (cantilever beam)
  // M = F × L
  const bendingMoment = radialLoad * overhang;

  // =========================================================================
  // Step 2: Preliminary Diameter Sizing
  // =========================================================================

  // Calculate required diameters for different criteria
  const diameters: number[] = [];

  // 1. Diameter for combined bending and torsion (stress criterion)
  const dStress = calculateDiameterForCombinedLoading(
    bendingMoment,
    torque,
    material,
    2.0 // Safety factor
  );
  diameters.push(dStress);

  // 2. Diameter for deflection limit (0.005" max)
  const dDeflection = calculateRequiredDiameter(
    0.005, // Target deflection in inches
    {
      diameter: 1.0, // Initial guess (not used in calculation)
      length: bearingSpan,
      load: radialLoad,
      position: overhang, // Assuming overhang extends beyond bearing
      material,
      supportType: 'cantilevered',
    }
  );
  diameters.push(dDeflection);

  // 3. Diameter for critical speed (must be > 1.3 × operating speed)
  const targetCriticalSpeed = speed * 1.4; // 40% margin for safety
  const dCritical = calculateDiameterForCriticalSpeed(
    targetCriticalSpeed,
    bearingSpan,
    material
  );
  diameters.push(dCritical);

  // Select the largest diameter (most conservative)
  let shaftDiameter = Math.max(...diameters);

  // Round up to nearest standard size (1/8" increments)
  shaftDiameter = Math.ceil(shaftDiameter * 8) / 8;

  // Minimum practical diameter (manufacturing consideration)
  if (shaftDiameter < 1.0) {
    shaftDiameter = 1.0;
  }

  // =========================================================================
  // Step 3: Design Shaft Features
  // =========================================================================

  const features: ShaftFeature[] = [];

  // Total shaft length = bearing span + overhang + coupling side
  const couplingExtension = shaftDiameter * 2; // Typical coupling extension
  const totalLength = bearingSpan + overhang + couplingExtension;

  // Feature 1: Left bearing seat (drive end)
  const bearingDiameter1 = shaftDiameter * 1.2; // Bearing seat slightly larger
  features.push({
    type: 'bearing-seat',
    position: couplingExtension, // After coupling extension
    diameter: bearingDiameter1,
    length: 1.0, // Typical bearing width
    notes: 'Drive-end bearing seat',
  });

  // Feature 2: Shoulder for bearing retention (left side)
  features.push({
    type: 'shoulder',
    position: couplingExtension,
    diameter: bearingDiameter1 + 0.125,
    radius: 0.0625, // 1/16" fillet radius (stress concentration)
    notes: 'Bearing shoulder - drive end',
  });

  // Feature 3: Right bearing seat (non-drive end)
  const bearingPosition2 = couplingExtension + bearingSpan;
  features.push({
    type: 'bearing-seat',
    position: bearingPosition2,
    diameter: bearingDiameter1, // Same size bearing
    length: 1.0,
    notes: 'Non-drive-end bearing seat',
  });

  // Feature 4: Shoulder for bearing retention (right side)
  features.push({
    type: 'shoulder',
    position: bearingPosition2,
    diameter: bearingDiameter1 + 0.125,
    radius: 0.0625,
    notes: 'Bearing shoulder - non-drive end',
  });

  // Feature 5: Impeller mount (at overhang end)
  const impellerPosition = totalLength - overhang / 2;
  features.push({
    type: 'impeller-mount',
    position: impellerPosition,
    diameter: shaftDiameter,
    length: overhang * 0.6, // Impeller hub length
    notes: 'Impeller mounting location',
  });

  // Feature 6: Keyway at impeller (for torque transmission)
  features.push({
    type: 'keyway',
    position: impellerPosition,
    diameter: shaftDiameter,
    length: overhang * 0.5,
    notes: `Key size: ${selectKeySize(shaftDiameter)}`,
  });

  // Feature 7: Coupling at drive end
  features.push({
    type: 'coupling',
    position: couplingExtension / 2,
    diameter: shaftDiameter,
    length: couplingExtension * 0.8,
    notes: 'Motor coupling connection',
  });

  // Feature 8: Keyway at coupling
  features.push({
    type: 'keyway',
    position: couplingExtension / 2,
    diameter: shaftDiameter,
    length: couplingExtension * 0.6,
    notes: `Key size: ${selectKeySize(shaftDiameter)}`,
  });

  // Feature 9: Thread at shaft end (for impeller nut/retention)
  const threadSize = selectThreadSize(shaftDiameter);
  features.push({
    type: 'thread',
    position: totalLength - 0.5,
    diameter: shaftDiameter,
    length: 0.75,
    notes: `Thread: ${threadSize}`,
  });

  // =========================================================================
  // Step 4: Return Complete Design
  // =========================================================================

  return {
    diameter: shaftDiameter,
    length: totalLength,
    features,
    material,
    torque,
    radialLoad,
    bendingMoment,
  };
}

/**
 * Select standard key size based on shaft diameter
 *
 * Reference: ANSI B17.1 - Keys and Keyseats
 *
 * @param shaftDiameter Shaft diameter (inches)
 * @returns Key size designation (e.g., "1/4 × 1/4")
 */
function selectKeySize(shaftDiameter: number): string {
  // Standard square keys (width × height in inches)
  if (shaftDiameter <= 0.4375) {
    return '1/8 × 1/8';
  } else if (shaftDiameter <= 0.875) {
    return '3/16 × 3/16';
  } else if (shaftDiameter <= 1.25) {
    return '1/4 × 1/4';
  } else if (shaftDiameter <= 1.75) {
    return '5/16 × 5/16';
  } else if (shaftDiameter <= 2.25) {
    return '3/8 × 3/8';
  } else if (shaftDiameter <= 2.75) {
    return '1/2 × 1/2';
  } else if (shaftDiameter <= 3.25) {
    return '5/8 × 5/8';
  } else if (shaftDiameter <= 3.75) {
    return '3/4 × 3/4';
  } else if (shaftDiameter <= 4.5) {
    return '7/8 × 7/8';
  } else {
    return '1 × 1';
  }
}

/**
 * Select standard thread size for shaft end
 *
 * Typically shaft end threads are 0.7-0.8 × shaft diameter
 *
 * @param shaftDiameter Shaft diameter (inches)
 * @returns Thread designation (e.g., "5/8-18 UNF")
 */
function selectThreadSize(shaftDiameter: number): string {
  const threadDiameter = shaftDiameter * 0.75;

  // Standard UNF (fine) threads
  if (threadDiameter <= 0.3125) {
    return '1/4-28 UNF';
  } else if (threadDiameter <= 0.4375) {
    return '3/8-24 UNF';
  } else if (threadDiameter <= 0.5625) {
    return '1/2-20 UNF';
  } else if (threadDiameter <= 0.6875) {
    return '5/8-18 UNF';
  } else if (threadDiameter <= 0.875) {
    return '3/4-16 UNF';
  } else if (threadDiameter <= 1.0625) {
    return '1-14 UNS';
  } else if (threadDiameter <= 1.3125) {
    return '1-1/4-12 UNF';
  } else if (threadDiameter <= 1.5625) {
    return '1-1/2-12 UNF';
  } else {
    return '2-12 UNF';
  }
}

/**
 * Calculate recommended bearing size based on shaft diameter
 *
 * @param shaftDiameter Shaft diameter (inches)
 * @returns Recommended bearing bore diameter (inches)
 */
export function recommendBearingSize(shaftDiameter: number): number {
  // Bearing bore should match shaft diameter at bearing seat
  // Round to nearest standard bearing size (metric converted to inches)

  // Common bearing bores (converted from metric):
  const standardBores = [
    0.3937, // 10mm
    0.4724, // 12mm
    0.6299, // 16mm
    0.7874, // 20mm
    0.9843, // 25mm
    1.1811, // 30mm
    1.3780, // 35mm
    1.5748, // 40mm
    1.7717, // 45mm
    1.9685, // 50mm
    2.3622, // 60mm
    2.7559, // 70mm
    3.1496, // 80mm
  ];

  // Find closest standard bore
  let closestBore = standardBores[0];
  let minDiff = Math.abs(shaftDiameter - closestBore);

  for (const bore of standardBores) {
    const diff = Math.abs(shaftDiameter - bore);
    if (diff < minDiff) {
      minDiff = diff;
      closestBore = bore;
    }
  }

  return closestBore;
}
