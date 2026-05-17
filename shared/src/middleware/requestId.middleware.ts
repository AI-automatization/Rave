import { RequestHandler } from 'express';
import crypto from 'crypto';
import { runWithContext } from '../utils/requestContext';

export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  runWithContext({ requestId: id }, next);
};
