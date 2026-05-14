import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/utils/errors';

export const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).optional(),
  movieId: Joi.string().pattern(/^[a-f\d]{24}$/i).optional(),
  videoUrl: Joi.string().uri().max(2048).optional(),
  videoTitle: Joi.string().trim().max(200).optional(),
  videoThumbnail: Joi.string().uri().max(2048).optional(),
  videoPlatform: Joi.string().valid('youtube', 'vimeo', 'direct', 'other').optional(),
  maxMembers: Joi.number().integer().min(2).max(50).optional(),
  isPrivate: Joi.boolean().optional(),
  password: Joi.string().min(1).max(100).optional(),
  startTime: Joi.number().integer().min(0).optional(),
});

export const joinRoomSchema = Joi.object({
  password: Joi.string().max(100).optional(),
});

export const updateMediaSchema = Joi.object({
  videoUrl: Joi.string().uri().max(2048).required(),
  videoTitle: Joi.string().trim().max(200).optional(),
  videoPlatform: Joi.string().valid('youtube', 'vimeo', 'direct', 'other').optional(),
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
