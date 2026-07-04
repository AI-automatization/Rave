import { ApiError } from '@/lib/api-client';

interface BackendError {
  error?: string;
  message?: string;
  code?: string;
  details?: string[];
}

const STATUS_MESSAGES: Record<number, string> = {
  403: 'Нет доступа',
  404: 'Не найдено',
  429: 'Слишком много запросов — подождите немного',
  500: 'Ошибка сервера',
  502: 'Сервис недоступен',
  503: 'Технические работы — попробуйте позже',
};

// Generic messages from Next.js proxy catch blocks — not useful to show to the user
const GENERIC_PROXY_MESSAGES = new Set(['Service unavailable', 'Internal server error']);

export function parseApiError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;

  const d = err.data as BackendError | null;

  // Validation details — show the first one
  if (d?.details?.length) return d.details[0];

  // Specific backend error field (legacy format)
  if (d?.error && !GENERIC_PROXY_MESSAGES.has(d.error)) return d.error;

  // Backend message field (standard apiResponse.error format)
  if (d?.message && !GENERIC_PROXY_MESSAGES.has(d.message)) return d.message;

  // Known status codes
  return STATUS_MESSAGES[err.status] ?? fallback;
}
