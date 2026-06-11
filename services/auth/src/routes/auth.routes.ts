import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';
import { AuthService } from '../services/auth.service';
import { authRateLimiter, initAdminRateLimiter, refreshRateLimiter, pollRateLimiter } from '@shared/middleware/rateLimiter.middleware';
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
  appleIdTokenSchema,
  changePasswordSchema,
  validate,
} from '../validators/auth.validator';
import Redis from 'ioredis';

export const createAuthRouter = (redis: Redis): Router => {
  const router = Router();
  const authService = new AuthService(redis);
  const authController = new AuthController(authService);
  const oauthController = new OAuthController(authService);

  // POST /auth/register — OTP yuborish
  router.post('/register', authRateLimiter, validate(registerSchema), authController.initiateRegister);

  // POST /auth/register/confirm — OTP tekshirish + user yaratish
  router.post('/register/confirm', authRateLimiter, validate(confirmRegisterSchema), authController.confirmRegister);

  // POST /auth/resend-verification — OTP qayta yuborish
  router.post('/resend-verification', authRateLimiter, validate(forgotPasswordSchema), authController.resendVerification);

  // POST /auth/login
  router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

  // POST /auth/refresh — #45 rate limited
  router.post('/refresh', refreshRateLimiter, validate(refreshTokenSchema), authController.refresh);

  // POST /auth/logout — #45 rate limited
  router.post('/logout', refreshRateLimiter, validate(refreshTokenSchema), authController.logout);

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
  const googlePassportCallback = passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/login-failed',
  });
  router.get('/google/callback', (req, res, next) => {
    const state = req.query.state as string | undefined;
    if (state?.startsWith('m:')) {
      oauthController.googleMobileCallback(req, res, next);
      return;
    }
    googlePassportCallback(req, res, next);
  }, oauthController.googleCallback);
  // POST /auth/google/token — Mobile: idToken → accessToken + refreshToken
  router.post('/google/token', authRateLimiter, validate(googleIdTokenSchema), oauthController.googleNativeToken);

  // POST /auth/google/exchange — temp code → tokens (one-time, 2 min TTL)
  router.post('/google/exchange', authRateLimiter, oauthController.googleExchange);

  // Mobile polling flow (works in Expo Go without a build)
  router.post('/google/init', authRateLimiter, oauthController.googleMobileInit);
  router.get('/google/mobile', oauthController.googleMobileRedirect);
  router.get('/google/poll', pollRateLimiter, oauthController.googleMobilePoll);

  // Apple Sign-In
  router.post('/apple/token', authRateLimiter, validate(appleIdTokenSchema), oauthController.appleToken);

  // Telegram auth (mobile)
  router.post('/telegram/login', authRateLimiter, oauthController.telegramLogin);   // hash verify → JWT
  router.post('/telegram/init', authRateLimiter, oauthController.telegramInit);     // polling flow init
  router.post('/telegram/webhook', authRateLimiter, oauthController.telegramWebhook); // bot updates
  router.get('/telegram/poll', pollRateLimiter, oauthController.telegramPoll);       // polling check
  router.get('/telegram/redirect', oauthController.telegramRedirect);               // deep link redirect

  // POST /auth/internal/create-staff — superadmin creates admin/operator/moderator account
  router.post('/internal/create-staff', requireInternalSecret, authController.createStaffAccount);

  // DELETE /auth/internal/users/:userId — admin deletes user from auth DB
  router.delete('/internal/users/:userId', requireInternalSecret, authController.deleteUser);

  // POST /auth/internal/users/:userId/revoke-sessions — admin blocks user, revoke all refresh tokens
  router.post('/internal/users/:userId/revoke-sessions', requireInternalSecret, authController.revokeUserSessions);

  // POST /auth/internal/appeal-decision-email — send appeal result to user email
  router.post('/internal/appeal-decision-email', requireInternalSecret, authController.sendAppealDecisionEmail);

  // POST /auth/init-admin — bir martalik superadmin yaratish (ADMIN_INIT_SECRET bilan himoyalangan)
  router.post('/init-admin', initAdminRateLimiter, authController.initAdmin);

  // PUT /auth/init-admin — superadmin credentials yangilash (upsert)
  router.put('/init-admin', initAdminRateLimiter, authController.upsertAdmin);

  // DELETE /auth/clear-attempts — brute force lock tozalash (internal only)
  router.delete('/clear-attempts', requireInternalSecret, authController.clearAttempts);

  return router;
};
