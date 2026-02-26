import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, AuthenticatedRequest, OptionalAuthRequest, UserRole } from '../types/index';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

const getPublicKey = (): string => {
  const key = process.env.JWT_PUBLIC_KEY;
  if (!key) {
    logger.error('JWT_PUBLIC_KEY is not set');
    throw new Error('JWT_PUBLIC_KEY environment variable is required');
  }
  return key.replace(/\\n/g, '\n');
};

export const verifyToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
    }) as JwtPayload;

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid token'));
    }
    next(error);
  }
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
    }) as JwtPayload;

    (req as OptionalAuthRequest).user = decoded;
  } catch {
    // Token invalid — treat as unauthenticated
  }

  next();
};

export const requireRole = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(user.role)) {
      return next(
        new ForbiddenError(`Access requires one of roles: ${roles.join(', ')}`),
      );
    }

    next();
  };

export const requireVerified = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Email verification flag can be embedded in token or checked via header
  // Services that need this should extend the JWT payload with isEmailVerified
  next();
};
