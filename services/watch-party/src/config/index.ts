import dotenv from 'dotenv';
import { scopedEnv } from '@shared/utils/scopedEnv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

// `media` runs content + watch-party in one process: WATCH_PARTY_<KEY> wins, plain <KEY> is the
// fallback, so the standalone service (plain names only) behaves exactly as before.
const requireScoped = (key: string): string => {
  const value = scopedEnv('WATCH_PARTY', key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3004', 10),
  mongoUri: requireScoped('MONGO_URI'),
  redisUrl: requireScoped('REDIS_URL'),
  jwtPublicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
  corsOrigins: scopedEnv('WATCH_PARTY', 'CORS_ORIGINS') ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',
  // Metered TURN — optional. If unset, /turn/credentials returns STUN-only (mesh still works on friendly NAT).
  meteredDomain: process.env.METERED_DOMAIN ?? '',
  meteredSecretKey: process.env.METERED_SECRET_KEY ?? '',
} as const;
