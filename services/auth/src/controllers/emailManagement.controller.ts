import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '../types/index';

// Authenticated email bind/change/verify handlers — see EmailManagementService
// for the OTP mechanics (mirrors PasswordAuthService registration flow).
export class EmailManagementController {
  constructor(private authService: AuthService) {}

  bindEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { email } = req.body as { email: string };
      const devCode = await this.authService.initBindEmail(userId, email);
      if (devCode !== null) {
        // eslint-disable-next-line no-console
        console.warn(`[DEV] Email bind OTP for ${email}: ${devCode}`);
      }
      res.status(200).json(apiResponse.success(null, 'Verification code sent to your new email'));
    } catch (error) {
      next(error);
    }
  };

  changeEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { email } = req.body as { email: string };
      const devCode = await this.authService.initChangeEmail(userId, email);
      if (devCode !== null) {
        // eslint-disable-next-line no-console
        console.warn(`[DEV] Email change OTP for ${email}: ${devCode}`);
      }
      res.status(200).json(apiResponse.success(null, 'Verification code sent to your new email'));
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { otp } = req.body as { otp: string };
      const user = await this.authService.verifyEmailBind(userId, otp);
      res.json(apiResponse.success(user, 'Email verified successfully'));
    } catch (error) {
      next(error);
    }
  };
}
