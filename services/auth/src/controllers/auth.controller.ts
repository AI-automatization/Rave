import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { AuthService } from '../services/auth.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '../types/index';

const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// OAuth (Google + Telegram) handlers live in ./oauth.controller.ts

export class AuthController {
  constructor(private authService: AuthService) {}

  initiateRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password } = req.body as { email: string; username: string; password: string };
      const devCode = await this.authService.initiateRegistration(email, username, password);
      if (devCode !== null) {
        // eslint-disable-next-line no-console
        console.warn(`[DEV] OTP for ${email}: ${devCode}`);
      }
      res.status(200).json(apiResponse.success(null, 'Verification code sent to your email'));
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      await this.authService.resendVerificationCode(email);
      res.json(apiResponse.success(null, 'Verification code resent'));
    } catch (error) {
      next(error);
    }
  };

  confirmRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, code } = req.body as { email: string; code: string };
      const user = await this.authService.confirmRegistration(email, code);

      // The OTP already proved this is the account owner, so hand back a session right away —
      // same shape as /login. Without it every new user landed on /login again immediately after
      // confirming (the web client sets its cookies from this response and had nothing to set),
      // which reads as "registration failed". `userId` stays in the payload for older clients.
      const ip = req.ip ?? null;
      const userAgent = req.headers['user-agent'] ?? null;
      const { accessToken, refreshToken } = await this.authService.generateAndStoreTokens(
        user._id.toString(), user.email, user.role as import('@shared/types').UserRole,
        ip, userAgent, true, user.username,
      );

      res.status(201).json(apiResponse.success(
        { userId: user._id, accessToken, refreshToken, user },
        'Registration successful',
      ));
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
      res.json(apiResponse.success({ accessToken, refreshToken, user }, 'Login successful'));
    } catch (error) {
      const err = error as { code?: string; reason?: string; userId?: string };
      if (err.code === 'ACCOUNT_BLOCKED') {
        res.status(403).json({
          success: false, code: 'ACCOUNT_BLOCKED',
          message: 'Account is blocked',
          reason: err.reason ?? 'No reason provided',
          userId: err.userId ?? null,
          data: null, errors: null,
        });
        return;
      }
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
      const err = error as { code?: string; reason?: string; userId?: string };
      if (err.code === 'ACCOUNT_BLOCKED') {
        res.status(403).json({
          success: false, code: 'ACCOUNT_BLOCKED',
          message: 'Account is blocked',
          reason: err.reason ?? 'No reason provided',
          userId: err.userId ?? null,
          data: null, errors: null,
        });
        return;
      }
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

  createStaffAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password, role } = req.body as {
        email: string; username: string; password: string;
        role: 'admin' | 'operator' | 'moderator';
      };
      const result = await this.authService.createStaffAccount(email, username, password, role);
      res.status(201).json(apiResponse.success(result, 'Staff account created'));
    } catch (error) {
      next(error);
    }
  };

  createTestUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password } = req.body as {
        email: string; username: string; password: string;
      };
      const result = await this.authService.createTestUser(email, username, password);
      res.status(201).json(apiResponse.success(result, 'Test user created'));
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      await this.authService.deleteUser(userId);
      res.json(apiResponse.success(null, 'User deleted from auth'));
    } catch (error) {
      next(error);
    }
  };

  revokeUserSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body as { reason?: string };
      await this.authService.revokeAndMarkBlocked(userId, reason);
      res.json(apiResponse.success(null, 'All sessions revoked'));
    } catch (error) {
      next(error);
    }
  };

  sendAppealDecisionEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, status, note } = req.body as { userId: string; status: 'approved' | 'rejected'; note?: string };
      if (!userId || !status) { res.status(400).json(apiResponse.error('userId and status required')); return; }
      await this.authService.sendAppealDecisionEmail(userId, status, note);
      res.json(apiResponse.success(null, 'Email sent'));
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

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
      await this.authService.changePassword(userId, oldPassword, newPassword);
      res.json(apiResponse.success(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const user = await import('../models/user.model').then(m => m.User.findById(userId));
      if (!user) { res.status(404).json(apiResponse.error('User not found')); return; }
      res.json(apiResponse.success(user, 'Profile retrieved'));
    } catch (error) {
      next(error);
    }
  };

  clearAttempts = async (req: Request, res: Response): Promise<void> => {
    const secret = process.env.ADMIN_INIT_SECRET;
    if (!secret) { res.status(403).json(apiResponse.error('Not configured')); return; }
    const { initSecret, email } = req.body as { initSecret: string; email: string };
    if (!safeCompare(initSecret, secret)) { res.status(403).json(apiResponse.error('Invalid secret')); return; }
    await this.authService.clearLoginAttempts(email);
    res.json(apiResponse.success(null, `Login attempts cleared for ${email}`));
  };

  upsertAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.ADMIN_INIT_SECRET;
      if (!secret) { res.status(403).json(apiResponse.error('Not configured')); return; }
      const { initSecret, email, username, password } = req.body as {
        initSecret: string; email: string; username: string; password: string;
      };
      if (!safeCompare(initSecret, secret)) { res.status(403).json(apiResponse.error('Invalid secret')); return; }
      const result = await this.authService.upsertSuperAdmin(email, username, password);
      res.json(apiResponse.success({ result }, `Superadmin ${result}`));
    } catch (error) {
      next(error);
    }
  };

  initAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.ADMIN_INIT_SECRET;
      if (!secret) { res.status(403).json(apiResponse.error('Not configured')); return; }
      const { initSecret, email, username, password } = req.body as {
        initSecret: string; email: string; username: string; password: string;
      };
      if (!safeCompare(initSecret, secret)) { res.status(403).json(apiResponse.error('Invalid secret')); return; }
      await this.authService.createSuperAdmin(email, username, password);
      res.json(apiResponse.success(null, 'Superadmin created'));
    } catch (error) {
      next(error);
    }
  };
}
