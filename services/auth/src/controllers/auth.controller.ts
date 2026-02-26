import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '../types/index';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password } = req.body as { email: string; username: string; password: string };
      const user = await this.authService.register(email, username, password);
      res.status(201).json(apiResponse.success({ userId: user._id }, 'Registration successful. Please verify your email.'));
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

      const { accessToken, refreshToken } = this.authService.generateTokens({
        userId: found._id.toString(),
        email: found.email,
        role: found.role as import('@shared/types').UserRole,
      });

      // Redirect to client with tokens (or set secure cookies)
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
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
}
