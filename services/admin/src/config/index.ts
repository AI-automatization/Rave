import dotenv from 'dotenv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3008', 10),
  mongoUri: requireEnv('MONGO_URI'),
  contentMongoUri: process.env.CONTENT_MONGO_URI ?? 'mongodb://cinesync:cinesync_dev_pass@localhost:27017/cinesync_content?authSource=admin',
  userMongoUri: process.env.USER_MONGO_URI ?? 'mongodb://cinesync:cinesync_dev_pass@localhost:27017/cinesync_user?authSource=admin',
  redisUrl: requireEnv('REDIS_URL'),
  jwtPublicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
} as const;
