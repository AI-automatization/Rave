import Redis from 'ioredis';
import { JwtPayload } from '@shared/types';
import { User } from '../models/user.model';
import { emailService } from '../utils/email.service';

// Re-export sub-services for direct use if needed
export { PasswordAuthService } from './passwordAuth.service';
export { GoogleAuthService } from './googleAuth.service';
export { TelegramAuthService } from './telegramAuth.service';
export { generateUniqueUsername } from './passwordAuth.service';

import { PasswordAuthService } from './passwordAuth.service';
import { GoogleAuthService } from './googleAuth.service';
import { TelegramAuthService } from './telegramAuth.service';
import { AppleAuthService } from './appleAuth.service';
import { EmailManagementService } from './emailManagement.service';

// AuthService facade — backward compatible with all existing controller imports
export class AuthService {
  public readonly password: PasswordAuthService;
  public readonly google: GoogleAuthService;
  public readonly telegram: TelegramAuthService;
  public readonly apple: AppleAuthService;
  public readonly emailManagement: EmailManagementService;

  constructor(redis: Redis) {
    this.password = new PasswordAuthService(redis);
    this.google = new GoogleAuthService(this.password, redis);
    this.telegram = new TelegramAuthService(redis, this.password);
    this.apple = new AppleAuthService(redis);
    this.emailManagement = new EmailManagementService(redis);
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

  revokeAndMarkBlocked = (userId: string, reason?: string) =>
    this.password.revokeAndMarkBlocked(userId, reason);

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

  createStaffAccount = (
    email: string,
    username: string,
    password: string,
    role: 'admin' | 'operator' | 'moderator',
  ) => this.password.createStaffAccount(email, username, password, role);

  createTestUser = (email: string, username: string, password: string) =>
    this.password.createTestUser(email, username, password);

  deleteUser = (userId: string) => this.password.deleteUser(userId);

  clearLoginAttempts = (email: string) => this.password.clearLoginAttempts(email);

  // ─── Google Auth delegates ───────────────────────────────────────────────────

  verifyGoogleIdToken = (idToken: string) =>
    this.google.verifyGoogleIdToken(idToken);

  findOrCreateGoogleUser = (profile: Parameters<GoogleAuthService['findOrCreateGoogleUser']>[0]) =>
    this.google.findOrCreateGoogleUser(profile);

  initMobileGoogleAuth = () =>
    this.google.initMobileGoogleAuth();

  isMobileGoogleState = (state: string) =>
    this.google.isMobileGoogleState(state);

  storeMobileGoogleResult = (state: string, data: object) =>
    this.google.storeMobileGoogleResult(state, data);

  pollMobileGoogleResult = (state: string) =>
    this.google.pollMobileGoogleResult(state);

  exchangeCodeForIdToken = (code: string) =>
    this.google.exchangeCodeForIdToken(code);

  // ─── Telegram Auth delegates ─────────────────────────────────────────────────

  initTelegramAuth = () =>
    this.telegram.initTelegramAuth();

  getTelegramLoginUrl = () =>
    this.telegram.getTelegramLoginUrl();

  loginWithTelegramData = (data: Parameters<TelegramAuthService['loginWithTelegramData']>[0]) =>
    this.telegram.loginWithTelegramData(data);

  handleTelegramWebhook = (update: Parameters<TelegramAuthService['handleTelegramWebhook']>[0]) =>
    this.telegram.handleTelegramWebhook(update);

  pollTelegramAuth = (state: string) =>
    this.telegram.pollTelegramAuth(state);

  findOrCreateTelegramUser = (profile: Parameters<TelegramAuthService['findOrCreateTelegramUser']>[0]) =>
    this.telegram.findOrCreateTelegramUser(profile);

  // ─── Apple Auth delegates ─────────────────────────────────────────────────────

  verifyAppleIdToken = (identityToken: string) =>
    this.apple.verifyAppleIdToken(identityToken);

  findOrCreateAppleUser = (profile: Parameters<AppleAuthService['findOrCreateAppleUser']>[0]) =>
    this.apple.findOrCreateAppleUser(profile);

  async sendAppealDecisionEmail(userId: string, status: 'approved' | 'rejected', note?: string): Promise<void> {
    const user = await User.findById(userId).select('email').lean();
    if (!user?.email) return;
    await emailService.sendAppealDecisionEmail({ to: user.email, status, note });
  }

  // ─── Email Management delegates (bind / change) ──────────────────────────────

  initBindEmail = (userId: string, newEmail: string) =>
    this.emailManagement.initBindEmail(userId, newEmail);

  initChangeEmail = (userId: string, newEmail: string) =>
    this.emailManagement.initChangeEmail(userId, newEmail);

  // Named distinctly from password.verifyEmail (registration token flow) to avoid collision.
  verifyEmailBind = (userId: string, otp: string) =>
    this.emailManagement.verifyEmail(userId, otp);
}
