import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '../types/index';

export class AuthController {
  constructor(private authService: AuthService) {}

  initiateRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password } = req.body as { email: string; username: string; password: string };
      const devCode = await this.authService.initiateRegistration(email, username, password);
      // In development, return OTP code in response (SMTP won't deliver in dev)
      const data = devCode !== null ? { _dev_otp: devCode } : null;
      res.status(200).json(apiResponse.success(data, 'Verification code sent to your email'));
    } catch (error) {
      next(error);
    }
  };

  confirmRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, code } = req.body as { email: string; code: string };
      const user = await this.authService.confirmRegistration(email, code);
      res.status(201).json(apiResponse.success({ userId: user._id }, 'Registration successful'));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const ip = req.ip ?? null;
      const userAgent = req.headers['user-agent'] ?? null;

      const { accessToken, refreshToken, user } = await this.authService.login(email, password, ip, userAgent);

      res.json(
        apiResponse.success(
          { accessToken, refreshToken, user },
          'Login successful',
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const ip = req.ip ?? null;
      const userAgent = req.headers['user-agent'] ?? null;

      const tokens = await this.authService.refreshTokens(refreshToken, ip, userAgent);
      res.json(apiResponse.success(tokens, 'Tokens refreshed'));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await this.authService.logout(refreshToken);
      res.json(apiResponse.success(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.authService.logoutAll(userId);
      res.json(apiResponse.success(null, 'All sessions terminated'));
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body as { token: string };
      await this.authService.verifyEmail(token);
      res.json(apiResponse.success(null, 'Email verified successfully'));
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      await this.authService.forgotPassword(email);
      // Always return success to prevent email enumeration
      res.json(apiResponse.success(null, 'If this email exists, a reset link has been sent.'));
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body as { token: string; newPassword: string };
      await this.authService.resetPassword(token, newPassword);
      res.json(apiResponse.success(null, 'Password reset successfully'));
    } catch (error) {
      next(error);
    }
  };

  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as import('../types/index').GoogleOAuthProfile;
      const found = await this.authService.findOrCreateGoogleUser(user);

      // Tokenlar yaratish + refresh tokenni DB ga saqlash (muhim: refresh bo'lmasin)
      const { accessToken, refreshToken } = await this.authService.generateAndStoreTokens(
        found._id.toString(),
        found.email,
        found.role as import('@shared/types').UserRole,
        req.ip ?? null,
        req.headers['user-agent'] ?? null,
      );

      // Tokenlarni URL da emas — short-lived code orqali (brauzer history/loglardan himoya)
      const code = await this.authService.createOAuthTempCode(accessToken, refreshToken);
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?code=${code}`);
    } catch (error) {
      next(error);
    }
  };

  googleNativeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken } = req.body as { idToken: string };
      const profile = await this.authService.verifyGoogleIdToken(idToken);
      const user = await this.authService.findOrCreateGoogleUser(profile);

      const { accessToken, refreshToken } = await this.authService.generateAndStoreTokens(
        user._id.toString(),
        user.email,
        user.role as import('@shared/types').UserRole,
        req.ip ?? null,
        req.headers['user-agent'] ?? null,
      );

      res.json(apiResponse.success({ user, accessToken, refreshToken }, 'Google login successful'));
    } catch (error) {
      next(error);
    }
  };

  googleExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body as { code: string };
      if (!code) {
        res.status(400).json(apiResponse.error('code is required'));
        return;
      }
      const tokens = await this.authService.exchangeOAuthCode(code);
      res.json(apiResponse.success(tokens, 'Tokens exchanged'));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const user = await import('../models/user.model').then(m => m.User.findById(userId));
      if (!user) {
        res.status(404).json(apiResponse.error('User not found'));
        return;
      }
      res.json(apiResponse.success(user, 'Profile retrieved'));
    } catch (error) {
      next(error);
    }
  };

  // ─── TELEGRAM AUTH ────────────────────────────────────────────────────────

  // POST /auth/telegram/login — hash verify → JWT (mobile direct flow)
  telegramLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as {
        id: string;
        first_name: string;
        last_name?: string;
        username?: string;
        photo_url?: string;
        auth_date: string;
        hash: string;
      };
      const result = await this.authService.loginWithTelegramData(data);
      res.json(apiResponse.success(result, 'Telegram login successful'));
    } catch (error) {
      next(error);
    }
  };

  telegramInit = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.initTelegramAuth();
      res.json(apiResponse.success(result, 'Telegram auth initiated'));
    } catch (error) {
      next(error);
    }
  };

  telegramWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = req.headers['x-telegram-bot-api-secret-token'];
      if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        res.status(403).json(apiResponse.error('Forbidden'));
        return;
      }
      await this.authService.handleTelegramWebhook(req.body as Parameters<typeof this.authService.handleTelegramWebhook>[0]);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  telegramPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { state } = req.query as { state: string };
      if (!state) {
        res.status(400).json(apiResponse.error('state is required'));
        return;
      }
      const result = await this.authService.pollTelegramAuth(state);
      if (!result) {
        res.status(202).json(apiResponse.success(null, 'Pending'));
        return;
      }
      res.json(apiResponse.success(result, 'Telegram login successful'));
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/init-admin — bir martalik superadmin yaratish
  // ADMIN_INIT_SECRET env var bilan himoyalangan
  initAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.ADMIN_INIT_SECRET;
      if (!secret) {
        res.status(403).json(apiResponse.error('Not configured'));
        return;
      }
      const { initSecret, email, username, password } = req.body as {
        initSecret: string;
        email: string;
        username: string;
        password: string;
      };
      if (initSecret !== secret) {
        res.status(403).json(apiResponse.error('Invalid secret'));
        return;
      }
      await this.authService.createSuperAdmin(email, username, password);
      res.json(apiResponse.success(null, 'Superadmin created'));
    } catch (error) {
      next(error);
    }
  };
}
