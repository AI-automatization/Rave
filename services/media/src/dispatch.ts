import type { Application, RequestHandler } from 'express';

export type ModuleName = 'content' | 'watch-party';

export interface Route {
  /** Matches `<prefix>` and `<prefix>/...` (case-insensitive, like express `app.use(prefix)`). */
  prefix: string;
  module: ModuleName;
}

/**
 * Route map (documented in README.md). watch-party owns exactly one prefix; everything else
 * (`/api/v1/content/**`, `/api/v1/youtube/**`, unknown paths) goes to content, which answers
 * unknown paths with the same 404 body both services always used.
 * socket.io (`/socket.io/**`) never reaches this table: engine.io answers it on the http server.
 */
export const ROUTES: readonly Route[] = [
  { prefix: '/api/v1/watch-party', module: 'watch-party' },
];

export const FALLBACK_MODULE: ModuleName = 'content';

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
 * standalone service. The code never looks at `Host`.
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
