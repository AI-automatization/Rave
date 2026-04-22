import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),

  mongoUri: requireEnv('MONGO_URI'),
  redisUrl: requireEnv('REDIS_URL'),

  jwt: {
    privateKey: requireEnv('JWT_PRIVATE_KEY').replace(/\\n/g, '\n').trim(),
    publicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n').trim(),
    accessTokenExpiry: '6h',
    refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  },

  email: {
    host: process.env.SMTP_HOST ?? 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'noreply@cinesync.app',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback',
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID ?? '',
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID ?? '',
  },

  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL ?? 'http://localhost:5173',
  superadminEmail: process.env.SUPERADMIN_EMAIL ?? 'saidazim186@gmail.com',
  userServiceUrl: process.env.USER_SERVICE_URL ?? 'http://localhost:3002',
} as const;
