import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or apps/api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'procureflow-super-secret-jwt-key-2026-production-grade',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'procureflow-super-secret-refresh-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
};
