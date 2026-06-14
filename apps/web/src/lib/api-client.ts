// Fetch wrapper for client-side API calls
// All requests go to /api/* (Next.js proxy routes)
// Handles 401 → refresh → retry automatically

import type { ApiResponse } from '@/types';

const BASE = '';

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function tryRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API error ${status}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipRefresh?: boolean;
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, skipRefresh, ...init } = options;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(`${BASE}${path}`, fetchOptions);

  // 401 → try refresh → retry original request
  if (res.status === 401 && !skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(`${BASE}${path}`, fetchOptions);
    }
  }

  const data = await res.json() as ApiResponse<T>;

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data;
}
