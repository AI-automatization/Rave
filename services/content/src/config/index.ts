import dotenv from 'dotenv';
import { scopedEnv } from '@shared/utils/scopedEnv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

// `media` runs content + watch-party in one process: CONTENT_<KEY> wins, plain <KEY> is the
// fallback, so the standalone service (plain names only) behaves exactly as before.
const requireScoped = (key: string): string => {
  const value = scopedEnv('CONTENT', key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3003', 10),
  mongoUri: requireScoped('MONGO_URI'),
  redisUrl: requireScoped('REDIS_URL'),
  elasticsearchUrl: scopedEnv('CONTENT', 'ELASTICSEARCH_URL') ?? 'http://elastic:changeme_dev@localhost:9200',
  jwtPublicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n').trim(),
  corsOrigins: scopedEnv('CONTENT', 'CORS_ORIGINS') ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
  hlsOutputDir: process.env.HLS_OUTPUT_DIR ?? '/tmp/cinesync-hls',
  // Railway: set FFMPEG_PATH env var if ffmpeg is not on PATH (e.g. /usr/bin/ffmpeg)
  ffmpegPath: process.env.FFMPEG_PATH ?? '',
} as const;
