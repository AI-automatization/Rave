import dotenv from 'dotenv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3003', 10),
  mongoUri: requireEnv('MONGO_URI'),
  redisUrl: requireEnv('REDIS_URL'),
  elasticsearchUrl: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  jwtPublicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n').trim(),
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
} as const;
