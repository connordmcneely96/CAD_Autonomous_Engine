/**
 * Critical Speed Calculations for Rotating Shafts
 *
 * Based on:
 * - Roark's Formulas for Stress and Strain, Table 16.1
 * - API 610 - Centrifugal Pumps (requires 30% margin above operating speed)
 * - Vance, J.M. "Rotordynamics of Turbomachinery"
 *
 * Critical speed is the rotational speed at which the shaft's natural frequency
 * matches the operating frequency, causing resonance and potentially catastrophic failure.
 *
 * Units: US Customary (inches, pounds, RPM)
 */

import { getMaterialProperties } from '../src/materials';
import { CriticalSpeedParams, CriticalSpeedResult } from '../src/types';

const GRAVITY = 386.4; // in/s² (US customary units)

/**
 * Calculate first critical speed using Rayleigh's method
 *
 * Rayleigh's quotient provides excellent approximation for first critical speed:
 * ω² = (g × Σ(P_i × y_i)) / Σ(P_i × y_i²)
 *
 * where:
 * - ω = angular velocity (rad/s)
 * - g = gravitational constant
 * - P_i = point loads (including shaft weight)
 * - y_i = static deflection at load point
 *
 * @param params Critical speed parameters
 * @returns Critical speed analysis
 */
export function calculateCriticalSpeed(
  params: CriticalSpeedParams
): CriticalSpeedResult {
  const {
    diameter,
    length,
    material,
    supportType,
    overhangMass = 0,
    overhangDistance = 0,
  } = params;

  // Get material properties
  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity; // psi
  const density = matProps.density; // lb/in³

  // Calculate moment of inertia
  const I = (Math.PI * Math.pow(diameter, 4)) / 64; // in⁴

  // Calculate shaft weight
  const area = (Math.PI * diameter * diameter) / 4; // in²
  const shaftWeight = area * length * density; // lb

  let criticalSpeedRad: number; // rad/s
  let formula: string;
  let reference: string;

  if (supportType === 'simply-supported') {
    // Method 1: Simplified Dunkerley's equation for uniform shaft
    // This is conservative (gives lower critical speed than actual)
    //
    // n_c = (π / L²) × √(E × I × g / w)
    //
    // where:
    // - L = shaft length
    // - w = weight per unit length
    //
    // Reference: Machinery's Handbook, 31st Ed., p. 261

    const w = (shaftWeight / length); // lb/in (weight per length)

    // Critical speed in rad/s
    criticalSpeedRad = (Math.PI / (length * length)) * Math.sqrt((E * I * GRAVITY) / w);

    formula =
      'ω_c = (π / L²) × √(E × I × g / w)';
    reference =
      "Machinery's Handbook, 31st Edition, p. 261 (Dunkerley's Method)";

    // If overhang mass exists, use Rayleigh's method for more accuracy
    if (overhangMass > 0 && overhangDistance > 0) {
      const result = calculateCriticalSpeedWithOverhang(
        diameter,
        length,
        material,
        overhangMass,
        overhangDistance
      );
      return result;
    }
  } else if (supportType === 'fixed-fixed') {
    // Fixed-fixed beam has higher critical speed than simply-supported
    // Multiply simply-supported result by √2 (conservative approximation)
    //
    // Reference: Vance, Rotordynamics of Turbomachinery, Ch. 4

    const w = shaftWeight / length;
    const simplySupportedSpeed =
      (Math.PI / (length * length)) * Math.sqrt((E * I * GRAVITY) / w);

    criticalSpeedRad = simplySupportedSpeed * Math.sqrt(2);

    formula =
      'ω_c = √2 × (π / L²) × √(E × I × g / w)';
    reference = 'Vance, Rotordynamics of Turbomachinery, Chapter 4';
  } else {
    throw new Error(`Unsupported support type: ${supportType}`);
  }

  // Convert from rad/s to RPM
  const firstCriticalSpeed = (criticalSpeedRad * 60) / (2 * Math.PI);

  // API 610 requirement: First critical speed must be at least 30% above operating speed
  // or 20% below operating speed (but this is less desirable)
  const requiredMargin = 30; // percent

  return {
    firstCriticalSpeed: Math.round(firstCriticalSpeed),
    requiredMargin,
    passed: false, // Will be set to true when compared with operating speed
    formula,
    reference,
  };
}

/**
 * Calculate critical speed with overhang mass using Rayleigh's method
 *
 * This is more accurate for shafts with concentrated masses (impellers, couplings, etc.)
 *
 * @param diameter Shaft diameter (inches)
 * @param length Shaft length between supports (inches)
 * @param material Material designation
 * @param overhangMass Mass at overhang (lb)
 * @param overhangDistance Distance from bearing to overhang mass (inches)
 * @returns Critical speed result
 */
function calculateCriticalSpeedWithOverhang(
  diameter: number,
  length: number,
  material: string,
  overhangMass: number,
  overhangDistance: number
): CriticalSpeedResult {
  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity;
  const density = matProps.density;
  const I = (Math.PI * Math.pow(diameter, 4)) / 64;

  // Calculate shaft weight
  const area = (Math.PI * diameter * diameter) / 4;
  const shaftWeight = area * length * density;

  // Rayleigh's method:
  // 1. Calculate static deflection at each mass point
  // 2. Apply Rayleigh's quotient

  // Deflection at center due to distributed shaft weight (simply supported)
  const w = shaftWeight / length; // lb/in
  const deflectionShaftCenter =
    (5 * w * Math.pow(length, 4)) / (384 * E * I);

  // Deflection at overhang due to overhang mass (cantilevered from bearing)
  const deflectionOverhang =
    (overhangMass * Math.pow(overhangDistance, 3)) / (3 * E * I);

  // Rayleigh's quotient (simplified for two masses)
  // ω² = g × (W₁×y₁ + W₂×y₂) / (W₁×y₁² + W₂×y₂²)
  const numerator = GRAVITY * (
    shaftWeight * deflectionShaftCenter +
    overhangMass * deflectionOverhang
  );
  const denominator =
    shaftWeight * deflectionShaftCenter * deflectionShaftCenter +
    overhangMass * deflectionOverhang * deflectionOverhang;

  const omegaSquared = numerator / denominator;
  const omegaRad = Math.sqrt(omegaSquared); // rad/s
  const criticalSpeedRPM = (omegaRad * 60) / (2 * Math.PI);

  return {
    firstCriticalSpeed: Math.round(criticalSpeedRPM),
    requiredMargin: 30,
    passed: false,
    formula:
      "ω = √(g × Σ(W_i × y_i) / Σ(W_i × y_i²))  (Rayleigh's Method)",
    reference: "Roark's Formulas, Table 16.1; API 610",
    rayleighQuotient: omegaSquared,
  };
}

/**
 * Check if critical speed meets API 610 requirements
 *
 * API 610 requires:
 * - First critical speed > 1.3 × maximum continuous speed, OR
 * - First critical speed < 0.8 × minimum operating speed
 *
 * @param criticalSpeedRPM First critical speed (RPM)
 * @param operatingSpeedRPM Operating speed (RPM)
 * @param maxSpeedRPM Maximum continuous speed (RPM) - default is 110% of operating
 * @returns Updated result with pass/fail status
 */
export function checkAPI610Compliance(
  criticalSpeedRPM: number,
  operatingSpeedRPM: number,
  maxSpeedRPM?: number
): {
  passed: boolean;
  margin: number;
  requiredMargin: number;
  recommendation: string;
} {
  const maxSpeed = maxSpeedRPM || operatingSpeedRPM * 1.1;

  // Calculate margin above operating speed
  const margin = ((criticalSpeedRPM - operatingSpeedRPM) / operatingSpeedRPM) * 100;

  const requiredMargin = 30; // 30% above operating speed

  let passed = false;
  let recommendation = '';

  if (criticalSpeedRPM > 1.3 * maxSpeed) {
    // First critical speed is safely above operating range
    passed = true;
    recommendation = `Critical speed is ${margin.toFixed(1)}% above operating speed - SAFE`;
  } else if (criticalSpeedRPM < 0.8 * operatingSpeedRPM) {
    // First critical speed is below operating range (less desirable but acceptable)
    passed = true;
    recommendation =
      'Critical speed is below operating range - acceptable but consider higher stiffness shaft';
  } else {
    // Critical speed is too close to operating speed - DANGEROUS
    passed = false;
    recommendation =
      'CRITICAL: Operating speed too close to first critical speed. Increase shaft diameter or reduce bearing span.';
  }

  return {
    passed,
    margin,
    requiredMargin,
    recommendation,
  };
}

/**
 * Calculate required diameter to achieve target critical speed
 *
 * @param targetCriticalSpeedRPM Desired critical speed (RPM)
 * @param length Shaft length (inches)
 * @param material Material designation
 * @returns Required diameter (inches)
 */
export function calculateDiameterForCriticalSpeed(
  targetCriticalSpeedRPM: number,
  length: number,
  material: string
): number {
  const matProps = getMaterialProperties(material);
  const E = matProps.modulusOfElasticity;
  const density = matProps.density;

  // Convert target RPM to rad/s
  const targetOmega = (targetCriticalSpeedRPM * 2 * Math.PI) / 60;

  // From Dunkerley's equation:
  // ω_c = (π / L²) × √(E × I × g / w)
  //
  // where:
  // - I = π × d⁴ / 64
  // - w = ρ × A = ρ × π × d² / 4
  //
  // Solving for d:
  // d = ⁴√((64 × L⁴ × ω_c² × ρ) / (4 × π² × E × g))

  const numerator = 64 * Math.pow(length, 4) * targetOmega * targetOmega * density;
  const denominator = 4 * Math.PI * Math.PI * E * GRAVITY;

  const requiredDiameter = Math.pow(numerator / denominator, 0.25);

  return requiredDiameter;
}

/**
 * Calculate second critical speed (rough approximation)
 *
 * For a uniform shaft, second critical speed ≈ 2.76 × first critical speed
 *
 * @param firstCriticalSpeedRPM First critical speed (RPM)
 * @returns Second critical speed (RPM) - approximate
 */
export function calculateSecondCriticalSpeed(
  firstCriticalSpeedRPM: number
): number {
  return firstCriticalSpeedRPM * 2.76;
}
