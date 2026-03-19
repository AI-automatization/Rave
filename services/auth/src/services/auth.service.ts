import Redis from 'ioredis';
import { JwtPayload } from '@shared/types';

// Re-export sub-services for direct use if needed
export { PasswordAuthService } from './passwordAuth.service';
export { GoogleAuthService } from './googleAuth.service';
export { TelegramAuthService } from './telegramAuth.service';
export { generateUniqueUsername, syncUserProfile } from './passwordAuth.service';

import { PasswordAuthService } from './passwordAuth.service';
import { GoogleAuthService } from './googleAuth.service';
import { TelegramAuthService } from './telegramAuth.service';

// AuthService facade — backward compatible with all existing controller imports
export class AuthService {
  public readonly password: PasswordAuthService;
  public readonly google: GoogleAuthService;
  public readonly telegram: TelegramAuthService;

  constructor(redis: Redis) {
    this.password = new PasswordAuthService(redis);
    this.google = new GoogleAuthService(this.password);
    this.telegram = new TelegramAuthService(redis, this.password);
  }

  // ─── Password Auth delegates ────────────────────────────────────────────────

  hashPassword = (password: string) =>
    this.password.hashPassword(password);

  comparePassword = (plain: string, hash: string) =>
    this.password.comparePassword(plain, hash);

  generateTokens = (payload: JwtPayload) =>
    this.password.generateTokens(payload);

  initiateRegistration = (...args: Parameters<PasswordAuthService['initiateRegistration']>) =>
    this.password.initiateRegistration(...args);

  resendVerificationCode = (email: string) =>
    this.password.resendVerificationCode(email);

  confirmRegistration = (email: string, code: string) =>
    this.password.confirmRegistration(email, code);

  login = (...args: Parameters<PasswordAuthService['login']>) =>
    this.password.login(...args);

  refreshTokens = (...args: Parameters<PasswordAuthService['refreshTokens']>) =>
    this.password.refreshTokens(...args);

  logout = (token: string) =>
    this.password.logout(token);

  logoutAll = (userId: string) =>
    this.password.logoutAll(userId);

  verifyEmail = (token: string) =>
    this.password.verifyEmail(token);

  forgotPassword = (email: string) =>
    this.password.forgotPassword(email);

  resetPassword = (token: string, newPassword: string) =>
    this.password.resetPassword(token, newPassword);

  changePassword = (userId: string, old: string, newPw: string) =>
    this.password.changePassword(userId, old, newPw);

  generateAndStoreTokens = (...args: Parameters<PasswordAuthService['generateAndStoreTokens']>) =>
    this.password.generateAndStoreTokens(...args);

  createOAuthTempCode = (access: string, refresh: string) =>
    this.password.createOAuthTempCode(access, refresh);

  exchangeOAuthCode = (code: string) =>
    this.password.exchangeOAuthCode(code);

  createSuperAdmin = (email: string, username: string, password: string) =>
    this.password.createSuperAdmin(email, username, password);

  upsertSuperAdmin = (email: string, username: string, password: string) =>
    this.password.upsertSuperAdmin(email, username, password);

  clearLoginAttempts = (email: string) => this.password.clearLoginAttempts(email);

  // ─── Google Auth delegates ───────────────────────────────────────────────────

  verifyGoogleIdToken = (idToken: string) =>
    this.google.verifyGoogleIdToken(idToken);

  findOrCreateGoogleUser = (profile: Parameters<GoogleAuthService['findOrCreateGoogleUser']>[0]) =>
    this.google.findOrCreateGoogleUser(profile);

  // ─── Telegram Auth delegates ─────────────────────────────────────────────────

  initTelegramAuth = () =>
    this.telegram.initTelegramAuth();

  loginWithTelegramData = (data: Parameters<TelegramAuthService['loginWithTelegramData']>[0]) =>
    this.telegram.loginWithTelegramData(data);

  handleTelegramWebhook = (update: Parameters<TelegramAuthService['handleTelegramWebhook']>[0]) =>
    this.telegram.handleTelegramWebhook(update);

  pollTelegramAuth = (state: string) =>
    this.telegram.pollTelegramAuth(state);

  findOrCreateTelegramUser = (profile: Parameters<TelegramAuthService['findOrCreateTelegramUser']>[0]) =>
    this.telegram.findOrCreateTelegramUser(profile);
}
