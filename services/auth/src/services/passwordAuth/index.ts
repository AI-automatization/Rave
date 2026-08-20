import Redis from 'ioredis';
import { JwtPayload } from '@shared/types';
import { hashPassword, comparePassword, generateTokens } from './crypto';
import { clearLoginAttempts } from './bruteForce';
import { generateUniqueUsername, RegisterService } from './register.service';
import { LoginService } from './login.service';
import { PasswordResetService } from './passwordReset.service';
import { changePassword } from './changePassword.service';
import { AccountManagementService } from './accountManagement.service';

export { generateUniqueUsername };

// PasswordAuthService facade — same pattern as AuthService in ../auth.service.ts, one
// level down. External callers (GoogleAuthService, TelegramAuthService, controllers) hold
// a single PasswordAuthService instance, so the class and its full public method surface
// stay exactly as they were; the implementations underneath are what got split by flow.
export class PasswordAuthService {
  private register: RegisterService;
  private loginSvc: LoginService;
  private reset: PasswordResetService;
  private accounts: AccountManagementService;

  constructor(private redis: Redis) {
    this.register = new RegisterService(redis);
    this.loginSvc = new LoginService(redis);
    this.reset = new PasswordResetService(redis);
    this.accounts = new AccountManagementService(redis);
  }

  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return comparePassword(plain, hash);
  }

  generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    return generateTokens(payload);
  }

  // ─── Registration ────────────────────────────────────────────────────────────

  initiateRegistration = (...args: Parameters<RegisterService['initiateRegistration']>) =>
    this.register.initiateRegistration(...args);

  resendVerificationCode = (email: string) =>
    this.register.resendVerificationCode(email);

  confirmRegistration = (email: string, code: string) =>
    this.register.confirmRegistration(email, code);

  // ─── Login / sessions ─────────────────────────────────────────────────────────

  login = (...args: Parameters<LoginService['login']>) =>
    this.loginSvc.login(...args);

  refreshTokens = (...args: Parameters<LoginService['refreshTokens']>) =>
    this.loginSvc.refreshTokens(...args);

  logout = (token: string) =>
    this.loginSvc.logout(token);

  logoutAll = (userId: string) =>
    this.loginSvc.logoutAll(userId);

  revokeAndMarkBlocked = (userId: string, reason?: string) =>
    this.loginSvc.revokeAndMarkBlocked(userId, reason);

  verifyEmail = (token: string) =>
    this.loginSvc.verifyEmail(token);

  generateAndStoreTokens = (...args: Parameters<LoginService['generateAndStoreTokens']>) =>
    this.loginSvc.generateAndStoreTokens(...args);

  createOAuthTempCode = (access: string, refresh: string) =>
    this.loginSvc.createOAuthTempCode(access, refresh);

  exchangeOAuthCode = (code: string) =>
    this.loginSvc.exchangeOAuthCode(code);

  // ─── Password reset ───────────────────────────────────────────────────────────

  forgotPassword = (email: string) =>
    this.reset.forgotPassword(email);

  resetPassword = (token: string, newPassword: string) =>
    this.reset.resetPassword(token, newPassword);

  // ─── Change password ──────────────────────────────────────────────────────────

  changePassword = (userId: string, oldPassword: string, newPassword: string) =>
    changePassword(userId, oldPassword, newPassword);

  // ─── Account management (admin/seed) ─────────────────────────────────────────

  createSuperAdmin = (email: string, username: string, password: string) =>
    this.accounts.createSuperAdmin(email, username, password);

  upsertSuperAdmin = (email: string, username: string, password: string) =>
    this.accounts.upsertSuperAdmin(email, username, password);

  createStaffAccount = (...args: Parameters<AccountManagementService['createStaffAccount']>) =>
    this.accounts.createStaffAccount(...args);

  createTestUser = (email: string, username: string, password: string) =>
    this.accounts.createTestUser(email, username, password);

  deleteUser = (userId: string) =>
    this.accounts.deleteUser(userId);

  clearLoginAttempts = (email: string) =>
    clearLoginAttempts(this.redis, email);
}
