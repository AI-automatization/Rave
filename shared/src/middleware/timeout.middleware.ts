import { RequestHandler } from 'express';

const DEFAULT_TIMEOUT_MS = 30_000;

export const timeout = (ms = DEFAULT_TIMEOUT_MS): RequestHandler =>
  (_req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          data: null,
          message: 'Request timeout',
          errors: null,
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
