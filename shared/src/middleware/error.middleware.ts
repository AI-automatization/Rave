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
