import Joi from 'joi';
import { PATTERNS } from '@shared/constants';

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

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

export const validate = (schema: Joi.ObjectSchema) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req: any, _res: any, next: any): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => d.message);
      next({ statusCode: 422, message: 'Validation failed', errors, isOperational: true });
      return;
    }
    next();
  };
