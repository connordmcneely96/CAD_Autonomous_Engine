/**
 * Shaft Stress Analysis
 *
 * Combined stress analysis for rotating shafts under:
 * - Bending (from radial loads)
 * - Torsion (from transmitted power)
 * - Axial loading (tension/compression)
 *
 * Based on:
 * - Shigley's Mechanical Engineering Design, 11th Edition, Ch. 7
 * - ASME Design Code for Process Piping (B31.3)
 * - Maximum Distortion Energy Theory (von Mises criterion)
 *
 * Units: US Customary (inches, pounds, psi)
 */

import { getMaterialProperties, calculateAllowableStress } from '../src/materials';
import { ShaftStressParams, StressResult } from '../src/types';

/**
 * Calculate combined stresses in a shaft
 *
 * Uses von Mises (distortion energy) failure criterion for ductile materials.
 * This is appropriate for steel shafts under combined loading.
 *
 * @param params Shaft loading parameters
 * @returns Stress analysis results
 */
export function calculateShaftStress(params: ShaftStressParams): StressResult {
  const {
    diameter,
    torque,
    bendingMoment,
    axialLoad = 0,
    material,
  } = params;

  // Get material properties
  const matProps = getMaterialProperties(material);

  // =========================================================================
  // Calculate Individual Stress Components
  // =========================================================================

  // 1. BENDING STRESS (from radial loads creating bending moment)
  //
  // σ_b = (M × c) / I
  //
  // where:
  // - M = bending moment (lb-in)
  // - c = distance from neutral axis to outer fiber = d/2 (in)
  // - I = moment of inertia = π × d⁴ / 64 (in⁴)
  //
  // Simplifies to:
  // σ_b = (32 × M) / (π × d³)
  //
  // Reference: Shigley's Eq. 3-27

  const bendingStress = (32 * bendingMoment) / (Math.PI * Math.pow(diameter, 3));

  // 2. TORSIONAL SHEAR STRESS (from transmitted torque)
  //
  // τ = (T × r) / J
  //
  // where:
  // - T = torque (lb-in)
  // - r = radius = d/2 (in)
  // - J = polar moment of inertia = π × d⁴ / 32 (in⁴)
  //
  // Simplifies to:
  // τ = (16 × T) / (π × d³)
  //
  // Reference: Shigley's Eq. 3-42

  const torsionalStress = (16 * torque) / (Math.PI * Math.pow(diameter, 3));

  // 3. AXIAL STRESS (from thrust loads)
  //
  // σ_a = F / A
  //
  // where:
  // - F = axial force (lbf)
  // - A = cross-sectional area = π × d² / 4 (in²)
  //
  // Simplifies to:
  // σ_a = (4 × F) / (π × d²)

  const area = (Math.PI * diameter * diameter) / 4;
  const axialStress = axialLoad / area;

  // =========================================================================
  // Combined Stress Analysis
  // =========================================================================

  // For rotating shafts, bending stress is COMPLETELY REVERSING (mean = 0)
  // while torsional stress is STEADY (mean = τ, alternating = 0)
  //
  // Maximum normal stress (occurs on shaft surface):
  // σ_max = σ_a + σ_b (axial + bending)

  const maxNormalStress = axialStress + bendingStress;

  // VON MISES EQUIVALENT STRESS (Distortion Energy Theory)
  //
  // For combined bending, torsion, and axial loading:
  //
  // σ_vm = √(σ_x² + 3×τ²)
  //
  // where:
  // - σ_x = axial + bending stress (psi)
  // - τ = torsional shear stress (psi)
  //
  // Reference: Shigley's Eq. 5-13
  //
  // This is the "equivalent" tensile stress that produces the same
  // distortion energy as the actual combined stress state.

  const vonMisesStress = Math.sqrt(
    maxNormalStress * maxNormalStress +
    3 * torsionalStress * torsionalStress
  );

  // MAXIMUM SHEAR STRESS (Tresca criterion - more conservative)
  //
  // For combined stresses:
  // τ_max = √((σ/2)² + τ²)
  //
  // Reference: Shigley's Eq. 3-46

  const maxShearStress = Math.sqrt(
    Math.pow(maxNormalStress / 2, 2) +
    Math.pow(torsionalStress, 2)
  );

  // =========================================================================
  // Safety Factor Calculation
  // =========================================================================

  // For STATIC loading, use yield strength with safety factor
  // For FATIGUE loading, use endurance limit (more complex - future enhancement)
  //
  // Typical safety factors:
  // - SF = 1.5 to 2.0 for well-known loads (pumps, fans)
  // - SF = 2.0 to 3.0 for average applications
  // - SF = 3.0 to 4.0 for uncertain loads

  const requiredSF = 2.0; // Conservative for pump shafts

  // Allowable stress = Yield Strength / SF
  const allowableStress = calculateAllowableStress(material, requiredSF);

  // Actual safety factor achieved
  const safetyFactor = matProps.yieldStrength / vonMisesStress;

  // Check if design passes
  const passed = vonMisesStress <= allowableStress;

  const formula =
    'σ_vm = √(σ_normal² + 3×τ_torsion²)  (von Mises)';
  const reference =
    "Shigley's Mechanical Engineering Design, 11th Ed., Eq. 5-13";

  return {
    bendingStress: Math.abs(bendingStress),
    torsionalStress: Math.abs(torsionalStress),
    axialStress: Math.abs(axialStress),
    vonMisesStress: Math.abs(vonMisesStress),
    maxShearStress: Math.abs(maxShearStress),
    allowableStress,
    safetyFactor,
    requiredSF,
    passed,
    formula,
    reference,
  };
}

/**
 * Calculate torque from power and speed
 *
 * T = (HP × 5252) / RPM
 *
 * where:
 * - HP = horsepower
 * - RPM = revolutions per minute
 * - 5252 = conversion factor (33,000 ft-lb/min ÷ 2π)
 *
 * Returns torque in lb-ft. Multiply by 12 to get lb-in.
 *
 * @param horsePower Power (HP)
 * @param speed Speed (RPM)
 * @returns Torque (lb-in)
 */
export function calculateTorqueFromPower(
  horsePower: number,
  speed: number
): number {
  const torqueLbFt = (horsePower * 5252) / speed;
  return torqueLbFt * 12; // Convert to lb-in
}

/**
 * Calculate required shaft diameter for pure torsion
 *
 * Uses ASME design code approach with allowable shear stress.
 *
 * For ductile materials, allowable shear stress:
 * τ_allowable = 0.577 × (S_y / SF)
 *
 * From torsion formula:
 * d = ³√((16 × T × SF) / (π × 0.577 × S_y))
 *
 * @param torque Torque (lb-in)
 * @param material Material designation
 * @param safetyFactor Safety factor (default 2.0)
 * @returns Required diameter (inches)
 */
export function calculateDiameterForTorsion(
  torque: number,
  material: string,
  safetyFactor: number = 2.0
): number {
  const matProps = getMaterialProperties(material);

  // Allowable shear stress (von Mises criterion)
  const allowableShear = (0.577 * matProps.yieldStrength) / safetyFactor;

  // Solve for diameter:
  // τ = (16 × T) / (π × d³)
  // d = ³√((16 × T) / (π × τ_allowable))

  const diameter = Math.pow(
    (16 * torque) / (Math.PI * allowableShear),
    1 / 3
  );

  return diameter;
}

/**
 * Calculate required shaft diameter for combined bending and torsion
 *
 * Uses ASME B31.3 approach with equivalent stress.
 *
 * For combined loading:
 * M_e = √(M² + T²)  (equivalent moment)
 *
 * Then:
 * d = ³√((32 × M_e × SF) / (π × S_y))
 *
 * @param bendingMoment Bending moment (lb-in)
 * @param torque Torque (lb-in)
 * @param material Material designation
 * @param safetyFactor Safety factor (default 2.0)
 * @returns Required diameter (inches)
 */
export function calculateDiameterForCombinedLoading(
  bendingMoment: number,
  torque: number,
  material: string,
  safetyFactor: number = 2.0
): number {
  const matProps = getMaterialProperties(material);

  // Equivalent moment (ASME method)
  const equivalentMoment = Math.sqrt(
    bendingMoment * bendingMoment +
    torque * torque
  );

  // Required diameter
  const diameter = Math.pow(
    (32 * equivalentMoment * safetyFactor) / (Math.PI * matProps.yieldStrength),
    1 / 3
  );

  return diameter;
}

/**
 * Calculate fatigue safety factor (simplified Goodman criterion)
 *
 * For rotating shafts under combined loading.
 * This is a simplified approach - full fatigue analysis requires
 * more parameters (surface finish, size factor, reliability, etc.)
 *
 * @param params Shaft stress parameters
 * @returns Fatigue safety factor
 */
export function calculateFatigueSafetyFactor(
  params: ShaftStressParams
): number {
  const matProps = getMaterialProperties(params.material);

  // Estimate endurance limit (for steels)
  // S_e ≈ 0.5 × S_ut (for polished specimens)
  // Apply correction factors (typical values):
  // - Surface factor (machined): 0.85
  // - Size factor (1-2" dia): 0.85
  // - Reliability factor (99%): 0.81
  const surfaceFactor = 0.85;
  const sizeFactor = 0.85;
  const reliabilityFactor = 0.81;

  const enduranceLimit =
    0.5 *
    matProps.tensileStrength *
    surfaceFactor *
    sizeFactor *
    reliabilityFactor;

  // Calculate alternating and mean stresses
  const staticResult = calculateShaftStress(params);

  // For rotating shaft:
  // - Bending stress is completely reversing (σ_a = σ_b, σ_m = 0)
  // - Torsional stress is steady (τ_a = 0, τ_m = τ)
  const alternatingStress = staticResult.bendingStress;
  const meanStress = staticResult.axialStress; // Axial is steady

  // Goodman criterion for fatigue:
  // 1/n = σ_a/S_e + σ_m/S_ut
  //
  // Solving for n:
  // n = 1 / (σ_a/S_e + σ_m/S_ut)

  const fatigueSF =
    1 /
    (alternatingStress / enduranceLimit +
      meanStress / matProps.tensileStrength);

  return fatigueSF;
}
