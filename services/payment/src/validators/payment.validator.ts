import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/utils/errors';

export const checkoutSchema = Joi.object({
  provider: Joi.string().valid('PAYME', 'CLICK').required(),
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
