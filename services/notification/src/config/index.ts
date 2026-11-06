import dotenv from 'dotenv';
import { scopedEnv } from '@shared/utils/scopedEnv';
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

// Railway template o'zgaruvchisi resolve bo'lmagan bo'lsa (${{...}}) — bo'sh string qaytaradi
const resolveEnv = (key: string): string => {
  const value = process.env[key]?.trim() ?? '';
  if (value.includes('{{')) return '';
  return value;
};

// `core` runs several services in one process: NOTIFICATION_<KEY> wins, plain <KEY> is the fallback.
const requireScoped = (key: string): string => {
  const value = scopedEnv('NOTIFICATION', key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3007', 10),
  mongoUri: requireEnv('MONGO_URI'),
  redisUrl: resolveEnv('REDIS_URL'),
  jwtPublicKey: requireScoped('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
  corsOrigins: scopedEnv('NOTIFICATION', 'CORS_ORIGINS') ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
  },

  email: {
    host: process.env.SMTP_HOST ?? 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: scopedEnv('NOTIFICATION', 'SMTP_PASS') ?? '',
    from: process.env.EMAIL_FROM ?? 'noreply@wewatch.uz',
  },

  telegram: {
    botToken: scopedEnv('NOTIFICATION', 'TELEGRAM_BOT_TOKEN') ?? '',
    botUsername: scopedEnv('NOTIFICATION', 'TELEGRAM_BOT_USERNAME') ?? 'RaveBot',
    webhookSecret: scopedEnv('NOTIFICATION', 'TELEGRAM_WEBHOOK_SECRET') ?? '',
    appScheme: process.env.APP_SCHEME ?? 'wewatch',
    webBaseUrl: process.env.WEB_BASE_URL ?? 'https://wewatch.uz',
    authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
    swarmGroupChatId: parseInt(process.env.SWARM_GROUP_CHAT_ID ?? '-1003874059304', 10),
  },
} as const;
