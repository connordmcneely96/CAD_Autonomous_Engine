import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10),
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://cad_user:cad_password@localhost:5432/cad_engine',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  services: {
    cadEngine: process.env.CAD_ENGINE_URL || 'http://localhost:8000',
    aiService: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;
