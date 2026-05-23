import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validate =
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
