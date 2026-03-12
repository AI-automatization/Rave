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

export const createMovieSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  originalTitle: Joi.string().max(300).optional(),
  description: Joi.string().max(5000).optional(),
  type: Joi.string().valid('movie', 'series', 'documentary', 'short').required(),
  genre: Joi.array().items(Joi.string()).min(1).required(),
  year: Joi.number().integer().min(1888).max(new Date().getFullYear() + 2).required(),
  duration: Joi.number().integer().min(1).optional(),
  posterUrl: Joi.string().uri().optional(),
  backdropUrl: Joi.string().uri().optional(),
  trailerUrl: Joi.string().uri().optional(),
  videoUrl: Joi.string().uri().optional(),
  language: Joi.string().max(10).optional(),
  country: Joi.string().max(100).optional(),
  ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17', '12+', '16+', '18+').optional(),
});
