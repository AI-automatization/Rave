import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
      return;
    }
    next();
  };

export const updateProfileSchema = Joi.object({
  bio: Joi.string().max(200).optional(),
});

export const updateSettingsSchema = Joi.object({
  notifications: Joi.object({
    friendRequest: Joi.boolean().optional(),
    friendAccepted: Joi.boolean().optional(),
    watchPartyInvite: Joi.boolean().optional(),
    battleInvite: Joi.boolean().optional(),
    battleResult: Joi.boolean().optional(),
    achievementUnlocked: Joi.boolean().optional(),
    friendOnline: Joi.boolean().optional(),
    emailDigest: Joi.boolean().optional(),
  }).optional(),
});

export const createProfileSchema = Joi.object({
  authId: Joi.string().required(),
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(20).pattern(/^[a-zA-Z0-9_]+$/).required(),
});

export const fcmTokenSchema = Joi.object({
  token: Joi.string().required(),
});

export { validate };
