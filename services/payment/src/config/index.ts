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
  port: parseInt(process.env.PORT ?? '3009', 10),
  mongoUri: requireEnv('MONGO_URI'),
  jwtPublicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081',

  // tezcode-billing — shared Tezcode billing platform (docs/INTEGRATION.md, provided by
  // Abdulaziz 2026-08-19 — separate repo/system, not part of this monorepo). Env names match
  // that doc's convention exactly (BILLING_URL / BILLING_API_KEY / BILLING_HMAC_SECRET /
  // BILLING_PRODUCT_CODE), not this repo's usual naming, so a value can be pasted straight
  // from tezcode-billing's onboarding without translation.
  //
  // WeWatch is registered there as productCode "WEWATCH" with plan "pro" (29 000 so'm/oy,
  // set up 2026-07-04 on the billing side). The actual apiKey/hmacSecret are Abdulaziz's to
  // hand over ("Шаг 0" in the doc) — not present here until that happens.
  billing: {
    baseUrl: process.env.BILLING_URL ?? 'https://pay.tezcode.dev',
    apiKey: process.env.BILLING_API_KEY ?? '',
    hmacSecret: process.env.BILLING_HMAC_SECRET ?? '',
    productCode: process.env.BILLING_PRODUCT_CODE ?? 'WEWATCH',
    proPlanSlug: process.env.BILLING_PRO_PLAN_SLUG ?? 'pro',
  },

  // Checkout muvaffaqiyatli/bekor qilingandan keyin foydalanuvchi qaytadigan sahifalar
  appWebBaseUrl: resolveEnv('APP_WEB_BASE_URL') || 'http://localhost:3000',

  // Internal service-to-service auth (mirrors every other service — @shared/utils/serviceClient)
  internalSecret: process.env.INTERNAL_SECRET ?? '',
} as const;
