import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/utils/errors';

const OBJECT_ID = Joi.string().pattern(/^[a-f\d]{24}$/i).message('Must be a valid ObjectId');

export const createBattleSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  duration: Joi.number().valid(3, 5, 7).required(),
});

export const inviteParticipantSchema = Joi.object({
  inviteeId: OBJECT_ID.required(),
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
