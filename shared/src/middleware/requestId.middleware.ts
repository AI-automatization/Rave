import { RequestHandler } from 'express';
import crypto from 'crypto';

export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('x-request-id', id);
  next();
};
