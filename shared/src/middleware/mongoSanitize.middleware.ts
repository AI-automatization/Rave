import { RequestHandler } from 'express';
import { logger } from '../utils/logger';

// Defence-in-depth against NoSQL injection: strips MongoDB operator keys ($ne, $gt, $where, …) and
// dotted paths (a.b) out of anything that came from the client, before a controller can hand it to
// a query. Validation (Joi/Zod) is still the primary guard — this exists so a route that forgets to
// validate, or validates loosely, can't turn `{"password": {"$ne": null}}` into an auth bypass.
//
// Written here rather than pulling in `express-mongo-sanitize`: the behaviour is ~30 lines, and
// this repo already keeps its cross-service middleware hand-rolled in this directory.

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Recursively deletes offending keys in place. Returns how many were removed.
 *
 * The container is left behind, not deleted: `{ password: { $ne: null } }` becomes
 * `{ password: {} }`, matching express-mongo-sanitize. That is safe — a query for
 * `{ password: {} }` matches documents whose field literally equals an empty object, so the
 * bypass is gone — and deleting the parent instead would silently drop fields a route may
 * require, turning an attack into a confusing 500.
 */
function stripOperators(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + stripOperators(item), 0);
  }
  if (!isPlainObject(value)) return 0;

  let removed = 0;
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      removed++;
      continue;
    }
    removed += stripOperators(value[key]);
  }
  return removed;
}

export const mongoSanitize: RequestHandler = (req, _res, next) => {
  // req.query and req.params are ordinary objects on Express 4, so they can be cleaned in place —
  // reassigning them is what breaks on Express 5, and is avoided here deliberately.
  const removed =
    stripOperators(req.body) + stripOperators(req.query) + stripOperators(req.params);

  if (removed > 0) {
    logger.warn('Stripped MongoDB operator keys from request', {
      path: req.path,
      method: req.method,
      removed,
    });
  }
  next();
};
