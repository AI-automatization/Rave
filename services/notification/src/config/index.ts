import dotenv from 'dotenv';
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

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3007', 10),
  mongoUri: requireEnv('MONGO_URI'),
  redisUrl: resolveEnv('REDIS_URL'),
  jwtPublicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
  },

  email: {
    host: process.env.SMTP_HOST ?? 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'noreply@cinesync.app',
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'RaveBot',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
    appScheme: process.env.APP_SCHEME ?? 'cinesync',
    webBaseUrl: process.env.WEB_BASE_URL ?? 'https://cinesync.app',
    authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
  },
} as const;
