import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { authRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { verifyToken } from '@shared/middleware/auth.middleware';
import {
  registerSchema,
  confirmRegisterSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
} from '../validators/auth.validator';
import Redis from 'ioredis';

export const createAuthRouter = (redis: Redis): Router => {
  const router = Router();
  const authService = new AuthService(redis);
  const authController = new AuthController(authService);

  // POST /auth/register — OTP yuborish
  router.post('/register', authRateLimiter, validate(registerSchema), authController.initiateRegister);

  // POST /auth/register/confirm — OTP tekshirish + user yaratish
  router.post('/register/confirm', authRateLimiter, validate(confirmRegisterSchema), authController.confirmRegister);

  // POST /auth/login
  router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

  // POST /auth/refresh
  router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

  // POST /auth/logout
  router.post('/logout', validate(refreshTokenSchema), authController.logout);

  // POST /auth/logout-all  (requires auth)
  router.post('/logout-all', verifyToken, authController.logoutAll);

  // POST /auth/forgot-password
  router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

  // POST /auth/reset-password
  router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

  // GET /auth/me
  router.get('/me', verifyToken, authController.getMe);

  // Google OAuth
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/login-failed' }),
    authController.googleCallback,
  );

  return router;
};
