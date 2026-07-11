import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/utils/errors';

export const sendInternalSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string().max(50).required(),
  title: Joi.string().trim().max(200).required(),
  body: Joi.string().trim().max(1000).required(),
  data: Joi.object().optional(),
});

export const broadcastSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().max(50).optional(),
  data: Joi.object().optional(),
});

export const notifyUsersSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).max(500).required(),
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().max(50).optional(),
});

export const scheduleEmailNudgeSchema = Joi.object({
  userId: Joi.string().required(),
});

export const validate = (schema: Joi.ObjectSchema | Joi.ArraySchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      next(new ValidationError('Validation failed', error.details.map((d) => d.message)));
      return;
    }
    next();
  };
