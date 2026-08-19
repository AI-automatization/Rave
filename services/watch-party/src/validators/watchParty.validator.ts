import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/utils/errors';
import { LIMITS } from '@shared/constants';

export const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).optional(),
  movieId: Joi.string().pattern(/^[a-f\d]{24}$/i).optional(),
  videoUrl: Joi.string().uri().max(2048).optional(),
  videoTitle: Joi.string().trim().max(200).optional(),
  videoThumbnail: Joi.string().uri().max(2048).optional(),
  videoPlatform: Joi.string().valid('youtube', 'vimeo', 'twitch', 'dailymotion', 'direct', 'webview', 'vk', 'rutube', 'tiktok', 'peertube', 'trovo', 'other').optional(),
  // Was .max(50) — the Mongoose model (watchPartyRoom.model.ts) has always capped this field at
  // 10 (matching LIMITS.MAX_WATCH_PARTY_MEMBERS, the Pro-tier ceiling), so a request between 11
  // and 50 silently got clamped to 10 downstream. Two sources of truth for the same limit,
  // drifted apart — this makes the validator match the model instead of relying on the clamp.
  maxMembers: Joi.number().integer().min(2).max(LIMITS.MAX_WATCH_PARTY_MEMBERS).optional(),
  isPrivate: Joi.boolean().optional(),
  password: Joi.string().min(1).max(100).optional(),
  startTime: Joi.number().integer().min(0).optional(),
  videoReferer: Joi.string().uri().allow('').max(2048).optional(),
});

export const joinRoomSchema = Joi.object({
  password: Joi.string().max(100).optional(),
});

export const updateMediaSchema = Joi.object({
  videoUrl: Joi.string().uri().max(2048).required(),
  videoTitle: Joi.string().trim().max(200).optional(),
  videoPlatform: Joi.string().valid('youtube', 'vimeo', 'twitch', 'dailymotion', 'direct', 'webview', 'vk', 'rutube', 'tiktok', 'peertube', 'trovo', 'other').optional(),
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
