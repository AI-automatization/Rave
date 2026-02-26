import { Request } from 'express';
import { JwtPayload } from '@shared/types';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface RegisterBody {
  email: string;
  username: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface VerifyEmailBody {
  token: string;
}

export interface GoogleOAuthProfile {
  id: string;
  email: string;
  displayName: string;
  picture: string;
}
