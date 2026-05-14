import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/utils/errors';

const OBJECT_ID = Joi.string().pattern(/^[a-f\d]{24}$/i).message('Must be a valid ObjectId');
const USER_ROLES = ['user', 'operator', 'moderator', 'admin', 'superadmin'] as const;

export const blockUserSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

export const changeRoleSchema = Joi.object({
  role: Joi.string().valid(...USER_ROLES).required(),
});

export const replyFeedbackSchema = Joi.object({
  reply: Joi.string().trim().min(1).max(2000).required(),
  status: Joi.string().valid('resolved', 'in_progress', 'closed').required(),
});

export const broadcastNotificationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().max(50).optional(),
});

export const sendNotificationSchema = Joi.object({
  userId: OBJECT_ID.required(),
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().max(50).optional(),
});

export const createStaffSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  username: Joi.string().pattern(/^[a-zA-Z0-9_]{3,20}$/).required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('operator', 'moderator', 'admin').required(),
});

export const addDomainSchema = Joi.object({
  domain: Joi.string().trim().min(1).max(253).required(),
});

export const setRestrictionsSchema = Joi.object({
  restrictions: Joi.array().items(Joi.string().max(50)).max(20).required(),
});

export const controlWatchPartySchema = Joi.object({
  action: Joi.string().valid('play', 'pause', 'seek').required(),
  currentTime: Joi.number().min(0).optional(),
});

export const validate = (schema: Joi.ObjectSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      next(new ValidationError('Validation failed', error.details.map((d) => d.message)));
      return;
    }
    next();
  };
