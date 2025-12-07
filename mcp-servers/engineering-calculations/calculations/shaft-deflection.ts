/**
 * Shaft Deflection Calculations
 *
 * Based on beam bending theory from:
 * - Roark's Formulas for Stress and Strain, 8th Edition
 * - Shigley's Mechanical Engineering Design, 11th Edition
 * - API 610 - Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
 *
 * Units: US Customary (inches, pounds, psi)
 */

import { getMaterialProperties } from '../src/materials';
import { ShaftDeflectionParams, DeflectionResult } from '../src/types';

/**
 * Calculate shaft deflection using beam theory
 *
 * @param params Shaft geometry and loading parameters
 * @returns Deflection analysis results
 */
export function calculateShaftDeflection(
  params: ShaftDeflectionParams
): DeflectionResult {
  const { diameter, length, load, position, material, supportType } = params;

  // Get material properties
  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity; // psi

  // Calculate moment of inertia (solid circular shaft)
  // I = π × d⁴ / 64
  const I = (Math.PI * Math.pow(diameter, 4)) / 64; // in⁴

  let deflection: number;
  let maxDeflection: number;
  let formula: string;
  let reference: string;
  const assumptions: string[] = [
    'Linear elastic behavior',
    'Small deflection theory',
    'Homogeneous isotropic material',
  ];

  switch (supportType) {
    case 'simply-supported': {
      // Simply supported beam with point load at position 'a'
      // Reference: Roark's Formulas, Table 8.1, Case 1c
      const a = position; // Distance from left support
      const b = length - position; // Distance from right support
      const L = length;

      // Deflection at load point
      // δ = (P × a × b × (L² - a² - b²)) / (6 × E × I × L)
      deflection =
        (load * a * b * (L * L - a * a - b * b)) / (6 * E * I * L);

      // Maximum deflection occurs at x = √(L²/3) when a = b (centered load)
      // For non-centered loads, use the load point deflection as conservative
      maxDeflection = deflection;

      formula =
        'δ = (P × a × b × (L² - a² - b²)) / (6 × E × I × L)';
      reference = "Roark's Formulas for Stress and Strain, Table 8.1, Case 1c";

      assumptions.push('Simply supported (pinned) ends');
      assumptions.push('Point load at specified location');

      break;
    }

    case 'fixed-fixed': {
      // Fixed-fixed beam with point load
      // Reference: Roark's Formulas, Table 8.1, Case 1h
      const a = position;
      const b = length - position;
      const L = length;

      // Deflection at load point
      // δ = (P × a² × b²) / (3 × E × I × L)
      deflection = (load * a * a * b * b) / (3 * E * I * L);
      maxDeflection = deflection;

      formula = 'δ = (P × a² × b²) / (3 × E × I × L)';
      reference = "Roark's Formulas for Stress and Strain, Table 8.1, Case 1h";

      assumptions.push('Fixed (built-in) ends');
      assumptions.push('Point load at specified location');

      break;
    }

    case 'cantilevered': {
      // Cantilevered beam with point load at free end
      // Reference: Roark's Formulas, Table 8.1, Case 1a
      const a = position; // Distance from fixed end

      // Deflection at distance 'a'
      // δ = (P × a³) / (3 × E × I)
      deflection = (load * Math.pow(a, 3)) / (3 * E * I);

      // Maximum deflection at free end (if load is at end)
      if (position === length) {
        maxDeflection = deflection;
      } else {
        // Maximum deflection at free end with load at 'a'
        const L = length;
        maxDeflection = (load * a * a * (3 * L - a)) / (6 * E * I);
      }

      formula = 'δ = (P × a³) / (3 × E × I)';
      reference = "Roark's Formulas for Stress and Strain, Table 8.1, Case 1a";

      assumptions.push('Fixed end at left support');
      assumptions.push('Free end at right');
      assumptions.push('Point load');

      break;
    }

    default:
      throw new Error(`Unsupported support type: ${supportType}`);
  }

  // API 610 Allowable Deflection Criteria
  // - Shaft deflection at seal: < 0.002 inches
  // - Shaft deflection at bearing: < 0.005 inches
  // - General guideline: < 0.005 inches for pump shafts
  const allowable = 0.005; // inches (conservative for general use)

  const passed = Math.abs(deflection) <= allowable;

  return {
    deflection: Math.abs(deflection),
    location: position,
    maxDeflection: Math.abs(maxDeflection),
    allowable,
    passed,
    formula,
    reference,
    assumptions,
  };
}

/**
 * Calculate deflection due to distributed load (shaft self-weight)
 *
 * @param diameter Shaft diameter (inches)
 * @param length Shaft length (inches)
 * @param material Material designation
 * @param supportType Support configuration
 * @returns Maximum deflection due to self-weight
 */
export function calculateDeflectionSelfWeight(
  diameter: number,
  length: number,
  material: string,
  supportType: 'simply-supported' | 'fixed-fixed' | 'cantilevered'
): number {
  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity; // psi
  const density = matProps.density; // lb/in³

  // Calculate moment of inertia
  const I = (Math.PI * Math.pow(diameter, 4)) / 64; // in⁴

  // Calculate weight per unit length
  const area = (Math.PI * diameter * diameter) / 4; // in²
  const w = density * area; // lb/in

  let deflection: number;

  switch (supportType) {
    case 'simply-supported':
      // Maximum deflection at center for uniformly distributed load
      // δ = (5 × w × L⁴) / (384 × E × I)
      // Reference: Roark's Table 8.1, Case 1a (uniform load)
      deflection = (5 * w * Math.pow(length, 4)) / (384 * E * I);
      break;

    case 'fixed-fixed':
      // Maximum deflection at center for uniformly distributed load
      // δ = (w × L⁴) / (384 × E × I)
      // Reference: Roark's Table 8.1, Case 1e
      deflection = (w * Math.pow(length, 4)) / (384 * E * I);
      break;

    case 'cantilevered':
      // Maximum deflection at free end
      // δ = (w × L⁴) / (8 × E × I)
      // Reference: Roark's Table 8.1
      deflection = (w * Math.pow(length, 4)) / (8 * E * I);
      break;

    default:
      throw new Error(`Unsupported support type: ${supportType}`);
  }

  return deflection;
}

/**
 * Calculate combined deflection (external load + self-weight)
 */
export function calculateTotalDeflection(
  params: ShaftDeflectionParams
): DeflectionResult {
  // Calculate deflection due to external load
  const externalResult = calculateShaftDeflection(params);

  // Calculate deflection due to self-weight
  const selfWeightDeflection = calculateDeflectionSelfWeight(
    params.diameter,
    params.length,
    params.material,
    params.supportType
  );

  // Total deflection (superposition principle)
  const totalDeflection = externalResult.deflection + selfWeightDeflection;
  const totalMaxDeflection = externalResult.maxDeflection + selfWeightDeflection;

  return {
    ...externalResult,
    deflection: totalDeflection,
    maxDeflection: totalMaxDeflection,
    passed: totalDeflection <= externalResult.allowable,
    assumptions: [
      ...externalResult.assumptions,
      'Includes self-weight of shaft',
      'Superposition of external load and self-weight',
    ],
  };
}

/**
 * Calculate required diameter to meet deflection limit
 *
 * @param targetDeflection Target maximum deflection (inches)
 * @param params Shaft parameters (uses diameter as initial guess)
 * @returns Required diameter in inches
 */
export function calculateRequiredDiameter(
  targetDeflection: number,
  params: ShaftDeflectionParams
): number {
  const { length, load, position, material, supportType } = params;

  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity;

  let requiredDiameter: number;

  switch (supportType) {
    case 'simply-supported': {
      const a = position;
      const b = length - position;
      const L = length;

      // Rearrange deflection formula to solve for diameter
      // δ = (P × a × b × (L² - a² - b²)) / (6 × E × I × L)
      // I = π × d⁴ / 64
      // Solving for d:
      // d = ⁴√((64 × P × a × b × (L² - a² - b²)) / (6 × π × E × δ × L))

      const numerator = (64 * load * a * b * (L * L - a * a - b * b));
      const denominator = 6 * Math.PI * E * targetDeflection * L;
      requiredDiameter = Math.pow(numerator / denominator, 0.25);

      break;
    }

    case 'fixed-fixed': {
      const a = position;
      const b = length - position;
      const L = length;

      // d = ⁴√((64 × P × a² × b²) / (3 × π × E × δ × L))
      const numerator = 64 * load * a * a * b * b;
      const denominator = 3 * Math.PI * E * targetDeflection * L;
      requiredDiameter = Math.pow(numerator / denominator, 0.25);

      break;
    }

    case 'cantilevered': {
      const a = position;

      // d = ⁴√((64 × P × a³) / (3 × π × E × δ))
      const numerator = 64 * load * Math.pow(a, 3);
      const denominator = 3 * Math.PI * E * targetDeflection;
      requiredDiameter = Math.pow(numerator / denominator, 0.25);

      break;
    }

    default:
      throw new Error(`Unsupported support type: ${supportType}`);
  }

  return requiredDiameter;
}

/**
 * Calculate slope (angular deflection) at a point
 *
 * @param params Shaft parameters
 * @returns Slope in radians
 */
export function calculateSlope(params: ShaftDeflectionParams): number {
  const { diameter, length, load, position, material, supportType } = params;

  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity;
  const I = (Math.PI * Math.pow(diameter, 4)) / 64;

  let slope: number;

  switch (supportType) {
    case 'simply-supported': {
      const a = position;
      const b = length - position;
      const L = length;

      // Slope at load point
      // θ = (P × a × b × (L - 2a)) / (6 × E × I × L)
      slope = (load * a * b * (L - 2 * a)) / (6 * E * I * L);
      break;
    }

    case 'fixed-fixed': {
      // Slope is zero at both ends (fixed supports)
      slope = 0;
      break;
    }

    case 'cantilevered': {
      const a = position;

      // Slope at distance 'a' from fixed end
      // θ = (P × a²) / (2 × E × I)
      slope = (load * a * a) / (2 * E * I);
      break;
    }

    default:
      throw new Error(`Unsupported support type: ${supportType}`);
  }

  return slope;
}
