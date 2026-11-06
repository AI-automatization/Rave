/**
 * Per-module environment lookup for the consolidated `core` service.
 *
 * `core` runs auth/user/notification/admin/payment in ONE process, so they share one
 * `process.env`. A few variables carry different values per module (CORS_ORIGINS,
 * JWT_PUBLIC_KEY, SMTP_PASS, TELEGRAM_*, ADMIN_URL, MONGO_URI ...). A module reads
 * `<PREFIX>_<KEY>` first and falls back to the plain `<KEY>`, so the standalone services
 * (which only set the plain name) behave exactly as before.
 *
 * Empty string counts as "unset" for the prefixed name only.
 */
export const scopedEnv = (prefix: string, key: string): string | undefined => {
  const scoped = process.env[`${prefix}_${key}`];
  if (scoped !== undefined && scoped !== '') return scoped;
  return process.env[key];
};
