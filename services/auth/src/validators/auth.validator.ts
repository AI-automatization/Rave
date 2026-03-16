import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { PATTERNS } from '@shared/constants';
import { ValidationError } from '@shared/utils/errors';

export const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  username: Joi.string().pattern(PATTERNS.USERNAME).required().messages({
    'string.pattern.base': 'Username must be 3-20 chars: letters, numbers, underscore only',
  }),
  password: Joi.string().pattern(PATTERNS.PASSWORD).required().messages({
    'string.pattern.base': 'Password must be 8+ chars with uppercase, lowercase and number',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().pattern(PATTERNS.PASSWORD).required().messages({
    'string.pattern.base': 'Password must be 8+ chars with uppercase, lowercase and number',
  }),
});

export const confirmRegisterSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  code: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Verification code must be 6 digits',
  }),
});

export const googleIdTokenSchema = Joi.object({
  idToken: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(PATTERNS.PASSWORD).required().messages({
    'string.pattern.base': 'Password must be 8+ chars with uppercase, lowercase and number',
  }),
});

export const validate = (schema: Joi.ObjectSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => d.message);
      next(new ValidationError('Validation failed', errors));
      return;
    }
    next();
  };
