import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { JwtPayload, AuthenticatedRequest, OptionalAuthRequest, UserRole } from '../types/index';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { REDIS_KEYS } from '../constants/index';

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

  if (!user.isEmailVerified) {
    return next(new ForbiddenError('Email verification required'));
  }

  next();
};

export const requireNotBlocked = (redis: Redis) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next();
    try {
      const blocked = await redis.get(REDIS_KEYS.blockedUser(user.userId));
      if (blocked) {
        return next(new ForbiddenError('Account is blocked'));
      }
    } catch (err) {
      // Redis unavailable — fail open to preserve availability, but log at error level
      // so on-call is alerted and can verify no blocked accounts are exploiting the window
      logger.error('requireNotBlocked: Redis unavailable, fail-open for user', {
        userId: user.userId,
        error: (err as Error).message,
      });
    }
    next();
  };
