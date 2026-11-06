import dotenv from 'dotenv';
import { scopedEnv } from '@shared/utils/scopedEnv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

// `core` runs several services in one process: USER_<KEY> wins, plain <KEY> is the fallback.
const requireScoped = (key: string): string => {
  const value = scopedEnv('USER', key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3002', 10),
  mongoUri: requireEnv('MONGO_URI'),
  redisUrl: requireEnv('REDIS_URL'),
  jwtPublicKey: requireScoped('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
  uploadPath: process.env.UPLOAD_PATH ?? './uploads',
  corsOrigins: scopedEnv('USER', 'CORS_ORIGINS') ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',
} as const;
