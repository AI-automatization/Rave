import dotenv from 'dotenv';
import { scopedEnv } from '@shared/utils/scopedEnv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

// `core` runs several services in one process: ADMIN_<KEY> wins, plain <KEY> is the fallback.
const requireScoped = (key: string): string => {
  const value = scopedEnv('ADMIN', key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3008', 10),
  mongoUri: requireScoped('MONGO_URI'),
  redisUrl: requireEnv('REDIS_URL'),
  jwtPublicKey: requireScoped('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
  adminUrls: (process.env.ADMIN_URL ?? 'http://localhost:5173').split(',').map((u) => u.trim()).filter(Boolean),
} as const;
