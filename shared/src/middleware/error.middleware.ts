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

  // Mongoose duplicate key error
  if ((error as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json(apiResponse.error('Resource already exists'));
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
