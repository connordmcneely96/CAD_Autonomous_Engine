/**
 * Type definitions for Engineering Calculations MCP Server
 */

// ============================================================================
// Material Properties
// ============================================================================

export interface MaterialProperties {
  designation: string;
  yieldStrength: number;      // psi
  tensileStrength: number;    // psi
  modulusOfElasticity: number; // psi
  shearModulus: number;       // psi
  density: number;            // lb/in³
  poissonRatio: number;       // dimensionless
}

// ============================================================================
// Shaft Calculations
// ============================================================================

export interface ShaftDeflectionParams {
  diameter: number;        // inches
  length: number;          // inches between supports
  load: number;            // lbf
  position: number;        // inches from left support
  material: string;        // Material designation
  supportType: 'simply-supported' | 'fixed-fixed' | 'cantilevered';
}

export interface DeflectionResult {
  deflection: number;      // inches
  location: number;        // inches
  maxDeflection: number;   // inches
  allowable: number;       // inches (typically 0.005")
  passed: boolean;
  formula: string;
  reference: string;
  assumptions: string[];
}

export interface CriticalSpeedParams {
  diameter: number;        // inches
  length: number;          // inches between supports
  material: string;        // Material designation
  supportType: 'simply-supported' | 'fixed-fixed';
  overhangMass?: number;   // lb (impeller, coupling, etc.)
  overhangDistance?: number; // inches from bearing
}

export interface CriticalSpeedResult {
  firstCriticalSpeed: number;    // RPM
  operatingSpeed?: number;       // RPM (if provided)
  marginPercent?: number;        // Percent above operating speed
  requiredMargin: number;        // Typically 30% (API 610)
  passed: boolean;
  formula: string;
  reference: string;
  rayleighQuotient?: number;     // Advanced calculation method
}

export interface ShaftStressParams {
  diameter: number;        // inches
  torque: number;          // lb-in
  bendingMoment: number;   // lb-in
  axialLoad?: number;      // lbf (tension/compression)
  material: string;        // Material designation
}

export interface StressResult {
  bendingStress: number;   // psi
  torsionalStress: number; // psi
  axialStress: number;     // psi
  vonMisesStress: number;  // psi (combined stress)
  maxShearStress: number;  // psi
  allowableStress: number; // psi
  safetyFactor: number;    // dimensionless
  requiredSF: number;      // Typically 1.5-2.0
  passed: boolean;
  formula: string;
  reference: string;
}

export interface ShaftGeometryParams {
  power: number;           // HP
  speed: number;           // RPM
  overhang: number;        // inches
  bearingSpan: number;     // inches
  material: string;        // Material designation
  applicationFactor?: number; // Load variation factor (default 1.5)
}

export interface ShaftGeometryResult {
  diameter: number;        // inches
  length: number;          // inches
  features: ShaftFeature[];
  material: string;
  torque: number;          // lb-in
  radialLoad: number;      // lbf
  bendingMoment: number;   // lb-in
}

export interface ShaftFeature {
  type: 'bearing-seat' | 'impeller-mount' | 'coupling' | 'shoulder' | 'keyway' | 'thread';
  position: number;        // inches from left end
  diameter: number;        // inches
  length?: number;         // inches
  radius?: number;         // inches (for fillets)
  notes?: string;
}

// ============================================================================
// Bearing Calculations
// ============================================================================

export interface BearingSelectionParams {
  radialLoad: number;      // lbf
  axialLoad: number;       // lbf
  speed: number;           // RPM
  shaftDiameter: number;   // inches
  desiredLife: number;     // hours (typically 20,000 for L10)
  lubrication: 'oil' | 'grease';
  temperature: number;     // °F
  applicationFactor?: number; // Service factor
}

export interface BearingResult {
  bearingNumber: string;   // Manufacturer part number
  type: string;            // 'deep-groove-ball', 'angular-contact', 'cylindrical-roller'
  bore: number;            // inches
  od: number;              // inches
  width: number;           // inches
  dynamicCapacity: number; // lbf (C rating)
  staticCapacity: number;  // lbf (C0 rating)
  l10Life: number;         // hours
  requiredLife: number;    // hours
  passed: boolean;
  limitingSpeed: number;   // RPM
  recommendation: string;
}

// ============================================================================
// Bolt Calculations
// ============================================================================

export interface BoltStressParams {
  boltSize: string;        // e.g., "3/4-10 UNC"
  preload: number;         // lbf
  externalLoad: number;    // lbf (tension or shear)
  loadType: 'tension' | 'shear' | 'combined';
  material: string;        // SAE grade or ASTM designation
  threadEngagement: number; // inches
}

export interface BoltStressResult {
  tensileStress: number;   // psi
  shearStress: number;     // psi
  proofLoad: number;       // lbf
  yieldLoad: number;       // lbf
  appliedLoad: number;     // lbf
  safetyFactor: number;    // dimensionless
  requiredSF: number;      // Typically 2.0-3.0
  passed: boolean;
  threadStripping: {
    internal: number;      // lbf
    external: number;      // lbf
    passed: boolean;
  };
  recommendation: string;
}

// ============================================================================
// Mechanical Seal Selection
// ============================================================================

export interface SealSelectionParams {
  shaftDiameter: number;   // inches
  speed: number;           // RPM
  pressure: number;        // psi
  temperature: number;     // °F
  fluid: string;           // Fluid type
  viscosity: number;       // cP
  applicationFactor?: number;
}

export interface SealResult {
  sealType: string;        // 'single', 'double', 'cartridge'
  faceConfiguration: string; // 'balanced', 'unbalanced'
  faceMaterial: string;    // 'silicon-carbide', 'tungsten-carbide'
  secondaryMaterial: string; // 'viton', 'EPDM', 'PTFE'
  pvFactor: number;        // psi × ft/min (pressure-velocity factor)
  maxPV: number;           // psi × ft/min (max allowable)
  passed: boolean;
  flushRequired: boolean;
  coolingRequired: boolean;
  recommendation: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface MCPResponse<T> {
  success: boolean;
  result?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    calculationTimeMs: number;
    confidence: number;      // 0.0 - 1.0
    assumptions: string[];
    warnings?: string[];
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;           // seconds
  calculationsPerformed: number;
  averageResponseTime: number; // ms
}
