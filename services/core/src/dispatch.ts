import type { Application, RequestHandler } from 'express';

export type ModuleName = 'auth' | 'user' | 'notification' | 'payment' | 'admin';

export interface Route {
  /** Matches `<prefix>` and `<prefix>/...` (case-insensitive, like express `app.use(prefix)`). */
  prefix: string;
  module: ModuleName;
}

/**
 * Route map (documented in README.md). Order is irrelevant: prefixes are disjoint.
 * Anything that matches none of them goes to `admin`, which owns the remaining
 * `/api/v1/*` routers (analytics, sync-stats, support, moderation, internal/*) and
 * answers unknown paths with the same 404 body every service already used.
 */
export const ROUTES: readonly Route[] = [
  { prefix: '/api/v1/auth', module: 'auth' },
  { prefix: '/api/v1/users', module: 'user' },
  { prefix: '/uploads', module: 'user' },
  { prefix: '/api/v1/notifications', module: 'notification' },
  { prefix: '/api/v1/payment', module: 'payment' },
  // Swagger UI exists only when NODE_ENV !== production; every service mounted it at the same
  // path, so core serves auth's (first) one. Dev-only, no production impact.
  { prefix: '/api-docs', module: 'auth' },
  { prefix: '/api-docs.json', module: 'auth' },
];

export const FALLBACK_MODULE: ModuleName = 'admin';

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compiled = ROUTES.map((r) => ({
  module: r.module,
  re: new RegExp(`^${escapeRe(r.prefix)}(?:/|$)`, 'i'),
}));

export const resolveModule = (path: string): ModuleName => {
  for (const r of compiled) if (r.re.test(path)) return r.module;
  return FALLBACK_MODULE;
};

/**
 * Hands the UNMODIFIED request to exactly one service app. Each service keeps its own full
 * middleware chain, 404 handler and error handler, so responses are identical to the
 * standalone service. (Mounting them one after another with app.use() would let the first
 * app's notFoundHandler swallow every other module's routes.)
 */
export const mountDispatcher = (
  top: Application,
  apps: Record<ModuleName, Application>,
): void => {
  const handler: RequestHandler = (req, res, next) => {
    apps[resolveModule(req.path)](req, res, next);
  };
  top.use(handler);
};
