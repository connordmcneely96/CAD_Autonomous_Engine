/**
 * Material Properties Database
 *
 * Common engineering materials with mechanical properties.
 * Units: US Customary (psi, lb/in³)
 *
 * References:
 * - Machinery's Handbook, 31st Edition
 * - ASM Metals Handbook
 * - ASME B31.3 Process Piping
 */

import { MaterialProperties } from './types';

export const MATERIALS: Record<string, MaterialProperties> = {
  // ========================================================================
  // Carbon Steels
  // ========================================================================

  'AISI 1018': {
    designation: 'AISI 1018',
    yieldStrength: 32000,        // psi
    tensileStrength: 58000,      // psi
    modulusOfElasticity: 29e6,   // psi (29 Mpsi)
    shearModulus: 11.5e6,        // psi
    density: 0.284,              // lb/in³
    poissonRatio: 0.29,
  },

  'AISI 1045': {
    designation: 'AISI 1045',
    yieldStrength: 45000,        // psi
    tensileStrength: 82000,      // psi
    modulusOfElasticity: 29e6,   // psi
    shearModulus: 11.5e6,        // psi
    density: 0.284,              // lb/in³
    poissonRatio: 0.29,
  },

  // ========================================================================
  // Alloy Steels (Heat Treated)
  // ========================================================================

  'AISI 4140': {
    designation: 'AISI 4140',
    yieldStrength: 64000,        // psi (Q&T @ 1200°F)
    tensileStrength: 95000,      // psi
    modulusOfElasticity: 29e6,   // psi
    shearModulus: 11.5e6,        // psi
    density: 0.283,              // lb/in³
    poissonRatio: 0.29,
  },

  'AISI 4340': {
    designation: 'AISI 4340',
    yieldStrength: 90000,        // psi (Q&T @ 1200°F)
    tensileStrength: 118000,     // psi
    modulusOfElasticity: 29e6,   // psi
    shearModulus: 11.5e6,        // psi
    density: 0.283,              // lb/in³
    poissonRatio: 0.29,
  },

  // ========================================================================
  // Stainless Steels
  // ========================================================================

  '304 SS': {
    designation: '304 SS',
    yieldStrength: 30000,        // psi (annealed)
    tensileStrength: 75000,      // psi
    modulusOfElasticity: 28e6,   // psi
    shearModulus: 10.6e6,        // psi
    density: 0.290,              // lb/in³
    poissonRatio: 0.29,
  },

  '316 SS': {
    designation: '316 SS',
    yieldStrength: 30000,        // psi (annealed)
    tensileStrength: 75000,      // psi
    modulusOfElasticity: 28e6,   // psi
    shearModulus: 10.6e6,        // psi
    density: 0.290,              // lb/in³
    poissonRatio: 0.29,
  },

  '17-4 PH': {
    designation: '17-4 PH',
    yieldStrength: 115000,       // psi (H900 condition)
    tensileStrength: 135000,     // psi
    modulusOfElasticity: 28.5e6, // psi
    shearModulus: 11.0e6,        // psi
    density: 0.280,              // lb/in³
    poissonRatio: 0.29,
  },

  // ========================================================================
  // Tool Steels
  // ========================================================================

  'D2': {
    designation: 'D2',
    yieldStrength: 85000,        // psi (hardened & tempered)
    tensileStrength: 140000,     // psi
    modulusOfElasticity: 29e6,   // psi
    shearModulus: 11.5e6,        // psi
    density: 0.279,              // lb/in³
    poissonRatio: 0.29,
  },

  // ========================================================================
  // Aluminum Alloys
  // ========================================================================

  '6061-T6': {
    designation: '6061-T6',
    yieldStrength: 40000,        // psi
    tensileStrength: 45000,      // psi
    modulusOfElasticity: 10e6,   // psi
    shearModulus: 3.8e6,         // psi
    density: 0.098,              // lb/in³
    poissonRatio: 0.33,
  },

  '7075-T6': {
    designation: '7075-T6',
    yieldStrength: 73000,        // psi
    tensileStrength: 83000,      // psi
    modulusOfElasticity: 10.3e6, // psi
    shearModulus: 3.9e6,         // psi
    density: 0.101,              // lb/in³
    poissonRatio: 0.33,
  },

  // ========================================================================
  // Titanium Alloys
  // ========================================================================

  'Ti-6Al-4V': {
    designation: 'Ti-6Al-4V',
    yieldStrength: 120000,       // psi
    tensileStrength: 130000,     // psi
    modulusOfElasticity: 16.5e6, // psi
    shearModulus: 6.2e6,         // psi
    density: 0.160,              // lb/in³
    poissonRatio: 0.34,
  },

  // ========================================================================
  // Copper Alloys (Bronze, Brass)
  // ========================================================================

  'C93200 Bronze': {
    designation: 'C93200 Bronze',
    yieldStrength: 20000,        // psi
    tensileStrength: 40000,      // psi
    modulusOfElasticity: 14.5e6, // psi
    shearModulus: 5.5e6,         // psi
    density: 0.320,              // lb/in³
    poissonRatio: 0.34,
  },

  // ========================================================================
  // Cast Irons
  // ========================================================================

  'Gray Iron Class 30': {
    designation: 'Gray Iron Class 30',
    yieldStrength: 25000,        // psi (estimated - no clear yield)
    tensileStrength: 30000,      // psi
    modulusOfElasticity: 15e6,   // psi
    shearModulus: 6.0e6,         // psi
    density: 0.260,              // lb/in³
    poissonRatio: 0.26,
  },

  'Ductile Iron 65-45-12': {
    designation: 'Ductile Iron 65-45-12',
    yieldStrength: 45000,        // psi
    tensileStrength: 65000,      // psi
    modulusOfElasticity: 24e6,   // psi
    shearModulus: 9.6e6,         // psi
    density: 0.252,              // lb/in³
    poissonRatio: 0.29,
  },
};

/**
 * Get material properties by designation
 */
export function getMaterialProperties(designation: string): MaterialProperties {
  const material = MATERIALS[designation];

  if (!material) {
    throw new Error(
      `Material "${designation}" not found. Available materials: ${Object.keys(MATERIALS).join(', ')}`
    );
  }

  return material;
}

/**
 * Get all available materials
 */
export function getAllMaterials(): MaterialProperties[] {
  return Object.values(MATERIALS);
}

/**
 * Search materials by minimum yield strength
 */
export function searchByYieldStrength(minYieldPsi: number): MaterialProperties[] {
  return getAllMaterials().filter(m => m.yieldStrength >= minYieldPsi);
}

/**
 * Search materials by maximum density (for weight-critical applications)
 */
export function searchByDensity(maxDensity: number): MaterialProperties[] {
  return getAllMaterials().filter(m => m.density <= maxDensity);
}

/**
 * Suggest material for shaft application
 */
export function suggestShaftMaterial(
  minYieldPsi: number,
  environment: 'standard' | 'corrosive' | 'high-temp'
): MaterialProperties[] {
  let candidates = searchByYieldStrength(minYieldPsi);

  // Filter by environment
  switch (environment) {
    case 'corrosive':
      candidates = candidates.filter(m =>
        m.designation.includes('SS') || // Stainless steels
        m.designation.includes('Ti') || // Titanium
        m.designation.includes('17-4 PH')
      );
      break;

    case 'high-temp':
      candidates = candidates.filter(m =>
        m.designation.includes('SS') || // Stainless steels
        m.designation.includes('Ti') || // Titanium
        m.designation.includes('4140') ||
        m.designation.includes('4340')
      );
      break;

    case 'standard':
    default:
      // All materials acceptable
      break;
  }

  // Sort by cost-effectiveness (approximated by yield/density ratio)
  candidates.sort((a, b) => {
    const scoreA = a.yieldStrength / (a.density * 1000);
    const scoreB = b.yieldStrength / (b.density * 1000);
    return scoreB - scoreA;
  });

  return candidates;
}

/**
 * Calculate allowable stress for design
 *
 * @param material Material designation
 * @param safetyFactor Safety factor (typically 1.5-2.0 for static, 2-4 for fatigue)
 * @returns Allowable stress in psi
 */
export function calculateAllowableStress(
  material: string,
  safetyFactor: number = 2.0
): number {
  const props = getMaterialProperties(material);
  return props.yieldStrength / safetyFactor;
}
