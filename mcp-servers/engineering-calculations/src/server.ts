/**
 * Engineering Calculations MCP Server
 *
 * REST API for mechanical engineering calculations:
 * - Shaft deflection, critical speed, stress analysis
 * - Bearing selection
 * - Bolt analysis
 * - Shaft geometry generation
 *
 * Port: 8100
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import pino from 'pino';
import { z } from 'zod';

// Import calculation modules
import { calculateShaftDeflection, calculateTotalDeflection } from '../calculations/shaft-deflection';
import { calculateCriticalSpeed, checkAPI610Compliance } from '../calculations/critical-speed';
import { calculateShaftStress, calculateTorqueFromPower } from '../calculations/shaft-stress';
import { generateShaftGeometry } from '../calculations/shaft-geometry';
import { getAllMaterials, getMaterialProperties, suggestShaftMaterial } from './materials';
import { MCPResponse, HealthCheckResponse } from './types';

// Load environment variables
config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8100;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('combined'));

// Performance tracking
let calculationsPerformed = 0;
let totalResponseTime = 0;
const serverStartTime = Date.now();

// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

const ShaftDeflectionSchema = z.object({
  diameter: z.number().positive(),
  length: z.number().positive(),
  load: z.number().positive(),
  position: z.number().nonnegative(),
  material: z.string(),
  supportType: z.enum(['simply-supported', 'fixed-fixed', 'cantilevered']),
  includeSelfWeight: z.boolean().optional().default(false),
});

const CriticalSpeedSchema = z.object({
  diameter: z.number().positive(),
  length: z.number().positive(),
  material: z.string(),
  supportType: z.enum(['simply-supported', 'fixed-fixed']),
  overhangMass: z.number().nonnegative().optional(),
  overhangDistance: z.number().positive().optional(),
  operatingSpeed: z.number().positive().optional(),
});

const ShaftStressSchema = z.object({
  diameter: z.number().positive(),
  torque: z.number().nonnegative(),
  bendingMoment: z.number().nonnegative(),
  axialLoad: z.number().optional().default(0),
  material: z.string(),
});

const ShaftGeometrySchema = z.object({
  power: z.number().positive(),
  speed: z.number().positive(),
  overhang: z.number().positive(),
  bearingSpan: z.number().positive(),
  material: z.string(),
  applicationFactor: z.number().positive().optional().default(1.5),
});

const TorqueCalculationSchema = z.object({
  power: z.number().positive(),
  speed: z.number().positive(),
});

const MaterialSuggestionSchema = z.object({
  minYieldPsi: z.number().positive(),
  environment: z.enum(['standard', 'corrosive', 'high-temp']).optional().default('standard'),
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap calculation with error handling and performance tracking
 */
function wrapCalculation<T>(
  calculation: () => T,
  req: Request,
  res: Response<MCPResponse<T>>
) {
  const startTime = Date.now();

  try {
    const result = calculation();
    const calculationTime = Date.now() - startTime;

    calculationsPerformed++;
    totalResponseTime += calculationTime;

    res.json({
      success: true,
      result,
      metadata: {
        calculationTimeMs: calculationTime,
        confidence: 0.95,
        assumptions: [],
      },
    });

    logger.info({
      endpoint: req.path,
      calculationTimeMs: calculationTime,
      success: true,
    });
  } catch (error: any) {
    const calculationTime = Date.now() - startTime;

    logger.error({
      endpoint: req.path,
      error: error.message,
      stack: error.stack,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: error.message,
        details: error.stack,
      },
      metadata: {
        calculationTimeMs: calculationTime,
        confidence: 0,
        assumptions: [],
      },
    });
  }
}

/**
 * Validate request body against schema
 */
function validateRequest<T>(
  schema: z.ZodSchema<T>,
  body: any
): T {
  return schema.parse(body);
}

// ============================================================================
// API Endpoints
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response<HealthCheckResponse>) => {
  const uptime = (Date.now() - serverStartTime) / 1000;
  const avgResponseTime = calculationsPerformed > 0
    ? totalResponseTime / calculationsPerformed
    : 0;

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime,
    calculationsPerformed,
    averageResponseTime: avgResponseTime,
  });
});

// Get all available materials
app.get('/api/materials', (req: Request, res: Response) => {
  wrapCalculation(() => getAllMaterials(), req, res);
});

// Get specific material properties
app.get('/api/materials/:designation', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const designation = req.params.designation;
    return getMaterialProperties(designation);
  }, req, res);
});

// Suggest materials for shaft
app.post('/api/materials/suggest', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(MaterialSuggestionSchema, req.body);
    return suggestShaftMaterial(params.minYieldPsi, params.environment);
  }, req, res);
});

// Calculate shaft deflection
app.post('/api/shaft/deflection', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(ShaftDeflectionSchema, req.body);

    if (params.includeSelfWeight) {
      return calculateTotalDeflection(params);
    } else {
      return calculateShaftDeflection(params);
    }
  }, req, res);
});

// Calculate critical speed
app.post('/api/shaft/critical-speed', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(CriticalSpeedSchema, req.body);
    const result = calculateCriticalSpeed(params);

    // If operating speed provided, check API 610 compliance
    if (params.operatingSpeed) {
      const compliance = checkAPI610Compliance(
        result.firstCriticalSpeed,
        params.operatingSpeed
      );

      return {
        ...result,
        operatingSpeed: params.operatingSpeed,
        marginPercent: compliance.margin,
        passed: compliance.passed,
      };
    }

    return result;
  }, req, res);
});

// Calculate shaft stress
app.post('/api/shaft/stress', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(ShaftStressSchema, req.body);
    return calculateShaftStress(params);
  }, req, res);
});

// Generate complete shaft geometry
app.post('/api/shaft/generate', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(ShaftGeometrySchema, req.body);
    return generateShaftGeometry(params);
  }, req, res);
});

// Calculate torque from power
app.post('/api/calculations/torque', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(TorqueCalculationSchema, req.body);
    return {
      torque: calculateTorqueFromPower(params.power, params.speed),
      power: params.power,
      speed: params.speed,
      unit: 'lb-in',
    };
  }, req, res);
});

// Complete shaft analysis (all calculations in one call)
app.post('/api/shaft/analyze', (req: Request, res: Response) => {
  wrapCalculation(() => {
    const params = validateRequest(ShaftGeometrySchema, req.body);

    // Generate geometry
    const geometry = generateShaftGeometry(params);

    // Calculate deflection
    const deflection = calculateShaftDeflection({
      diameter: geometry.diameter,
      length: params.bearingSpan,
      load: geometry.radialLoad,
      position: params.overhang,
      material: params.material,
      supportType: 'cantilevered',
    });

    // Calculate critical speed
    const criticalSpeedResult = calculateCriticalSpeed({
      diameter: geometry.diameter,
      length: params.bearingSpan,
      material: params.material,
      supportType: 'simply-supported',
      overhangMass: geometry.radialLoad / 386.4, // Convert to mass
      overhangDistance: params.overhang,
    });

    const criticalSpeedCompliance = checkAPI610Compliance(
      criticalSpeedResult.firstCriticalSpeed,
      params.speed
    );

    // Calculate stress
    const stress = calculateShaftStress({
      diameter: geometry.diameter,
      torque: geometry.torque,
      bendingMoment: geometry.bendingMoment,
      axialLoad: 0,
      material: params.material,
    });

    return {
      geometry,
      deflection,
      criticalSpeed: {
        ...criticalSpeedResult,
        operatingSpeed: params.speed,
        ...criticalSpeedCompliance,
      },
      stress,
      summary: {
        diameter: geometry.diameter,
        length: geometry.length,
        material: params.material,
        deflectionPassed: deflection.passed,
        criticalSpeedPassed: criticalSpeedCompliance.passed,
        stressPassed: stress.passed,
        overallPassed:
          deflection.passed &&
          criticalSpeedCompliance.passed &&
          stress.passed,
      },
    };
  }, req, res);
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.path} not found`,
    },
    metadata: {
      calculationTimeMs: 0,
      confidence: 0,
      assumptions: [],
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message,
    },
    metadata: {
      calculationTimeMs: 0,
      confidence: 0,
      assumptions: [],
    },
  });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  logger.info(`Engineering Calculations MCP Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API Documentation: http://localhost:${PORT}/api/docs (coming soon)`);
});

export default app;
