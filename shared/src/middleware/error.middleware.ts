import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { apiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Real prod incident 2026-08-07 (watch-party createRoom): the shared timeout() middleware can
  // already have sent a 503 to the client (request took >30s, e.g. content-service's extraction
  // call running slow) by the time a handler's own await finally rejects and lands here — every
  // branch below unconditionally called res.status().json(), which crashed the whole process with
  // ERR_HTTP_HEADERS_SENT instead of just failing the one request. This guard makes that a no-op.
  if (res.headersSent) {
    logger.error('errorHandler called after headers already sent', {
      message: error.message,
      path: req.path,
      method: req.method,
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error('Operational error', {
        message: error.message,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
        stack: error.stack,
      });
    } else {
      logger.warn('Client error', {
        message: error.message,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
      });
    }

    res.status(error.statusCode).json(apiResponse.error(error.message, error.errors));
    return;
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values((error as unknown as Record<string, unknown>).errors as Record<string, { message: string }>).map(
      (e) => e.message,
    );
    res.status(422).json(apiResponse.error('Validation failed', errors));
    return;
  }

  // Mongoose duplicate key error — MongoDB returns numeric 11000, not string
  const errCode = (error as { code?: unknown }).code;
  if (errCode === 11000 || errCode === '11000') {
    res.status(409).json(apiResponse.error('Resource already exists'));
    return;
  }

  // Plain Error thrown from services with custom statusCode/code/reason (e.g. ACCOUNT_BLOCKED)
  const customErr = error as Error & { statusCode?: number; code?: string; reason?: string };
  if (customErr.statusCode && typeof customErr.statusCode === 'number' && customErr.statusCode < 500) {
    logger.warn('Service error', { message: error.message, statusCode: customErr.statusCode, code: customErr.code, path: req.path });
    res.status(customErr.statusCode).json({
      success: false,
      data: null,
      code: customErr.code,
      message: error.message,
      reason: customErr.reason,
      errors: null,
    });
    return;
  }

  // Unhandled errors
  logger.error('Unhandled error', {
    message: error.message,
    path: req.path,
    method: req.method,
    stack: error.stack,
  });

  res.status(500).json(apiResponse.error('Internal server error'));
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(apiResponse.error(`Route ${req.method} ${req.path} not found`));
};
