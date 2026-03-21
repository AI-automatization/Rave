import { Request, Response, NextFunction } from 'express';
import { ApiLog } from '../models/apiLog.model';
import { AuthenticatedRequest } from '../types/index';

// Paths to skip (health checks, docs — no noise)
const SKIP_PATHS = ['/health', '/api-docs', '/favicon.ico'];

function levelFromStatus(statusCode: number): 'info' | 'warn' | 'error' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

export function apiLogger(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SKIP_PATHS.some(p => req.path.startsWith(p))) {
      next();
      return;
    }

    const startedAt = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      const statusCode = res.statusCode;
      const level = levelFromStatus(statusCode);

      const userId = (req as AuthenticatedRequest).user?.userId ?? null;
      const ip = (req.ip ?? req.socket?.remoteAddress ?? null);

      const message = `${req.method} ${req.path} ${statusCode} ${duration}ms`;

      // Fire-and-forget — never await in middleware
      ApiLog.create({
        service: serviceName,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration,
        userId,
        ip,
        userAgent: req.headers['user-agent'] ?? null,
        level,
        message,
        meta: {},
        timestamp: new Date(startedAt),
      }).catch(() => {
        // DB unavailable — silent, never crash the service
      });
    });

    next();
  };
}
