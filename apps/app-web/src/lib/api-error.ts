import { ApiError } from '@/lib/api-client';

interface BackendError {
  error?: string;
  message?: string;
  code?: string;
  errors?: string[];
}

// Message KEYS (messages/*.json → common.*), not text: this module is plain TS called from
// mutation callbacks, so it cannot hold a translator itself. useApiError() (hooks/use-api-error.ts)
// binds them to the active locale; parseApiError() without a translator falls back to the caller's
// own already-translated fallback string.
const STATUS_KEYS: Record<number, string> = {
  403: 'httpForbidden',
  404: 'httpNotFound',
  429: 'httpTooManyRequests',
  500: 'httpServerError',
  502: 'httpServiceUnavailable',
  503: 'httpMaintenance',
};

// Generic messages from Next.js proxy catch blocks — not useful to show to the user
const GENERIC_PROXY_MESSAGES = new Set(['Service unavailable', 'Internal server error']);

export function parseApiError(err: unknown, fallback: string, tCommon?: (key: string) => string): string {
  if (!(err instanceof ApiError)) return fallback;

  const d = err.data as BackendError | null;

  // Validation errors (backend apiResponse.error(message, errors) shape) — show the first one
  if (d?.errors?.length) return d.errors[0];

  // Specific backend error field (legacy format)
  if (d?.error && !GENERIC_PROXY_MESSAGES.has(d.error)) return d.error;

  // Backend message field (standard apiResponse.error format)
  if (d?.message && !GENERIC_PROXY_MESSAGES.has(d.message)) return d.message;

  // Known status codes
  const key = STATUS_KEYS[err.status];
  return key && tCommon ? tCommon(key) : fallback;
}
