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
  username: Joi.string().min(3).max(20).pattern(/^[a-zA-Z0-9_]+$/).optional(),
  bio: Joi.string().max(200).allow('').optional(),
});

export const updateSettingsSchema = Joi.object({
  notifications: Joi.object({
    friendRequest: Joi.boolean().optional(),
    friendAccepted: Joi.boolean().optional(),
    watchPartyInvite: Joi.boolean().optional(),
    friendOnline: Joi.boolean().optional(),
    emailDigest: Joi.boolean().optional(),
  }).optional(),
  privacy: Joi.object({
    allowForward: Joi.boolean().optional(),
  }).optional(),
});

export const fcmTokenSchema = Joi.object({
  token: Joi.string().required(),
});

export const muteConversationSchema = Joi.object({
  muted: Joi.boolean().required(),
});

export const pinConversationSchema = Joi.object({
  pinned: Joi.boolean().required(),
});

export const pinMessageSchema = Joi.object({
  pinned: Joi.boolean().required(),
});

export const markReadUpToSchema = Joi.object({
  messageId: Joi.string().required(),
});

export { validate };
