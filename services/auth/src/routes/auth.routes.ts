import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { authRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { verifyToken, requireNotBlocked } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import {
  registerSchema,
  confirmRegisterSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleIdTokenSchema,
  changePasswordSchema,
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

  // POST /auth/resend-verification — OTP qayta yuborish
  router.post('/resend-verification', authRateLimiter, validate(forgotPasswordSchema), authController.resendVerification);

  // POST /auth/login
  router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

  // POST /auth/refresh
  router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

  // POST /auth/logout
  router.post('/logout', validate(refreshTokenSchema), authController.logout);

  const notBlocked = requireNotBlocked(redis);

  // POST /auth/logout-all  (requires auth)
  router.post('/logout-all', verifyToken, notBlocked, authController.logoutAll);

  // POST /auth/forgot-password
  router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

  // POST /auth/reset-password
  router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

  // GET /auth/me
  router.get('/me', verifyToken, notBlocked, authController.getMe);

  // POST /auth/change-password — authenticated (T-S030)
  router.post('/change-password', verifyToken, notBlocked, validate(changePasswordSchema), authController.changePassword);

  // Google OAuth
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/login-failed' }),
    authController.googleCallback,
  );
  // POST /auth/google/token — Mobile: idToken → accessToken + refreshToken
  router.post('/google/token', authRateLimiter, validate(googleIdTokenSchema), authController.googleNativeToken);

  // POST /auth/google/exchange — temp code → tokens (one-time, 2 min TTL)
  router.post('/google/exchange', authController.googleExchange);

  // Telegram auth (mobile)
  router.post('/telegram/login', authRateLimiter, authController.telegramLogin);   // hash verify → JWT
  router.post('/telegram/init', authRateLimiter, authController.telegramInit);     // polling flow init
  router.post('/telegram/webhook', authController.telegramWebhook);                // bot updates
  router.get('/telegram/poll', authController.telegramPoll);                       // polling check

  // POST /auth/internal/create-staff — superadmin creates admin/operator/moderator account
  router.post('/internal/create-staff', requireInternalSecret, authController.createStaffAccount);

  // POST /auth/internal/users/:userId/revoke-sessions — admin blocks user, revoke all refresh tokens
  router.post('/internal/users/:userId/revoke-sessions', requireInternalSecret, authController.revokeUserSessions);

  // POST /auth/init-admin — bir martalik superadmin yaratish (ADMIN_INIT_SECRET bilan himoyalangan)
  router.post('/init-admin', authRateLimiter, authController.initAdmin);

  // PUT /auth/init-admin — superadmin credentials yangilash (upsert)
  router.put('/init-admin', authController.upsertAdmin);

  // DELETE /auth/clear-attempts — brute force lock tozalash
  router.delete('/clear-attempts', authController.clearAttempts);

  return router;
};
