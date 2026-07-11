// User display helpers.

// Telegram login has no email, so the backend stores a synthetic placeholder
// (`tg_<id>@telegram.wewatch.internal`, see services/auth telegramAuth.service)
// purely to satisfy the unique+required email column. It must never be shown as
// if it were the user's real address. The legacy `.cinesync.internal` domain
// (pre-rename) still exists for older accounts, so match both.
const PLACEHOLDER_EMAIL_DOMAINS = ['@telegram.wewatch.internal', '@telegram.cinesync.internal'];

/** Real email for display, or null for Telegram accounts (synthetic placeholder). */
export function displayEmail(email?: string | null): string | null {
  if (!email) return null;
  if (PLACEHOLDER_EMAIL_DOMAINS.some((d) => email.endsWith(d))) return null;
  return email;
}
