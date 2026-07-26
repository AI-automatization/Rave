import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { User, IUserDocument } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';
import { emailService } from '../utils/email.service';
import {
  UnauthorizedError,
  ConflictError,
  TooManyRequestsError,
  BadRequestError,
  ForbiddenError,
} from '@shared/utils/errors';
import { containsBannedWord } from '@shared/utils/bannedWords';
import { getAppSetting } from '@shared/utils/appSettings';
import { JwtPayload, UserRole } from '@shared/types';
import { REDIS_KEYS } from '@shared/constants';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

/**
 * Per-instance login-attempt counter used only while Redis is unreachable.
 *
 * It is deliberately NOT a replacement for the Redis counter: with several auth instances behind
 * the load balancer an attacker's attempts spread across them, so the effective limit during an
 * outage is `MAX_LOGIN_ATTEMPTS × instances`. That is still bounded, where the previous behaviour
 * (log the failure, allow the login attempt) was unbounded. Full fail-closed was rejected because
 * a Redis blip would then lock every user out of the product.
 */
const fallbackAttempts = {
  entries: new Map<string, { count: number; expiresAt: number }>(),

  get(email: string): number {
    const entry = this.entries.get(email);
    if (!entry) return 0;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(email);
      return 0;
    }
    return entry.count;
  },

  increment(email: string): void {
    // Prune on write — this map only ever fills up during an outage, and clearing expired rows
    // here avoids needing a timer that would otherwise run forever for nothing.
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    const current = this.entries.get(email);
    if (current && current.expiresAt > now) {
      current.count++;
      return;
    }
    this.entries.set(email, { count: 1, expiresAt: now + BLOCK_DURATION_SECONDS * 1000 });
  },

  clear(email: string): void {
    this.entries.delete(email);
  },
};

// ─── Shared module-level utilities ──────────────────────────────────────────

export async function generateUniqueUsername(displayName: string): Promise<string> {
  const base = displayName.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || 'user';
  let username = base;
  let suffix = 1;

  while (await User.findOne({ username })) {
    username = `${base}${suffix++}`;
  }

  return username;
}


// ─── PasswordAuthService ─────────────────────────────────────────────────────

export class PasswordAuthService {
  constructor(private redis: Redis) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, config.jwt.privateKey, {
      algorithm: 'RS256',
      expiresIn: config.jwt.accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshToken = crypto.randomBytes(64).toString('hex');

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async initiateRegistration(email: string, username: string, password: string): Promise<string | null> {
    const registrationEnabled = await getAppSetting<boolean>('registrationEnabled');
    if (!registrationEnabled) {
      throw new ForbiddenError('Registration is temporarily disabled');
    }

    if (await containsBannedWord(username)) {
      throw new BadRequestError('Username contains prohibited content');
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new ConflictError(
        existing.email === email ? 'Email already registered' : 'Username already taken',
      );
    }

    const passwordHash = await this.hashPassword(password);
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP

    const pending = JSON.stringify({
      username,
      passwordHash,
      otpHash: this.hashToken(code),
    });

    // Redis da 10 daqiqa saqlash
    await this.redis.setex(REDIS_KEYS.pendingReg(email), 600, pending);

    // Email yuborish (xato bo'lsa ham initiate muvaffaqiyatli)
    emailService.sendVerificationEmail(email, code).catch((err) =>
      logger.warn('Verification email failed', { error: (err as Error).message }),
    );

    logger.info('Registration initiated', { email });

    // Dev mode: return code directly so it can be included in response
    return config.nodeEnv !== 'production' ? code : null;
  }

  async resendVerificationCode(email: string): Promise<void> {
    const raw = await this.redis.get(REDIS_KEYS.pendingReg(email));
    if (!raw) {
      throw new BadRequestError('Pending registration not found. Please register again.');
    }

    const pending = JSON.parse(raw) as { username: string; passwordHash: string; otpHash: string };
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const updated = JSON.stringify({ ...pending, otpHash: this.hashToken(code) });
    await this.redis.setex(REDIS_KEYS.pendingReg(email), 600, updated);

    emailService.sendVerificationEmail(email, code).catch((err) =>
      logger.warn('Resend verification email failed', { error: (err as Error).message }),
    );

    logger.info('Verification code resent', { email });
  }

  async confirmRegistration(email: string, code: string): Promise<IUserDocument> {
    const raw = await this.redis.get(REDIS_KEYS.pendingReg(email));
    if (!raw) throw new BadRequestError('Verification code expired or not found. Please register again.');

    const pending = JSON.parse(raw) as { username: string; passwordHash: string; otpHash: string };

    if (pending.otpHash !== this.hashToken(code)) {
      throw new BadRequestError('Invalid verification code');
    }

    await this.redis.del(REDIS_KEYS.pendingReg(email));

    const user = await User.create({
      email,
      username: pending.username,
      passwordHash: pending.passwordHash,
      isEmailVerified: true,
      rank: 'Bronze',
      totalPoints: 0,
      fcmTokens: [],
      bio: '',
      restrictions: [],
      settings: { notifications: {} },
    });

    logger.info('User registered and verified', { userId: user._id, email });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(email, user.username).catch((err) =>
      logger.warn('Welcome email failed', { error: (err as Error).message }),
    );

    return user;
  }

  async login(
    email: string,
    password: string,
    ip: string | null,
    userAgent: string | null,
  ): Promise<{ accessToken: string; refreshToken: string; user: IUserDocument }> {
    // Brute force check
    await this.checkBruteForce(email);

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      await this.incrementLoginAttempts(email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check MongoDB flag AND Redis flag (admin panel sets Redis directly without updating auth DB)
    const redisBlockedValue = await this.redis.get(REDIS_KEYS.blockedUser(String(user._id))).catch(() => null);
    if (user.isBlocked || redisBlockedValue !== null) {
      // Redis value stores the block reason (or '' / '1' for legacy entries)
      const redisReason = redisBlockedValue && redisBlockedValue !== '1' ? redisBlockedValue : null;
      const reason = user.blockReason ?? redisReason ?? 'No reason provided';
      const err = new Error(reason) as Error & { statusCode: number; code: string; reason: string; userId: string };
      err.statusCode = 403;
      err.code = 'ACCOUNT_BLOCKED';
      err.reason = reason;
      err.userId = String(user._id);
      throw err;
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await this.incrementLoginAttempts(email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Clear brute force counter on success
    try {
      await this.redis.del(REDIS_KEYS.loginAttempts(email));
    } catch {
      logger.warn('Redis unavailable — clearing in-memory login attempts instead', { email });
    }
    // Always clear the fallback too: a successful login must not leave a stale count behind that
    // locks the user out once Redis comes back and the two counters disagree.
    fallbackAttempts.clear(email);

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    await RefreshToken.create({
      userId: user._id.toString(),
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.jwt.refreshTokenExpiry),
      ip,
      userAgent,
    });

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date(), lastDevice: userAgent ?? null });

    logger.info('User logged in', { userId: user._id });

    // Staff login → send self-notification + alert superadmin
    if (['admin', 'superadmin', 'operator', 'moderator'].includes(user.role)) {
      emailService.sendAdminLoginAlert({
        adminEmail: user.email,
        ip,
        userAgent,
        role: user.role,
        timestamp: new Date(),
      }).catch(() => {/* silent */});
    }

    return { accessToken, refreshToken, user };
  }

  async refreshTokens(
    rawRefreshToken: string,
    ip: string | null,
    userAgent: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    const redisBlockedOnRefresh = await this.redis.get(REDIS_KEYS.blockedUser(String(user._id))).catch(() => null);
    if (user.isBlocked || redisBlockedOnRefresh !== null) {
      const redisReason = redisBlockedOnRefresh && redisBlockedOnRefresh !== '1' ? redisBlockedOnRefresh : null;
      const reason = user.blockReason ?? redisReason ?? 'No reason provided';
      const err = new Error(reason) as Error & { statusCode: number; code: string; reason: string; userId: string };
      err.statusCode = 403;
      err.code = 'ACCOUNT_BLOCKED';
      err.reason = reason;
      err.userId = String(user._id);
      throw err;
    }

    // Rotate — delete old, create new
    await RefreshToken.deleteOne({ _id: stored._id });

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    await RefreshToken.create({
      userId: user._id.toString(),
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.jwt.refreshTokenExpiry),
      ip,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await RefreshToken.deleteOne({ tokenHash });
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
    logger.info('All sessions terminated', { userId });
  }

  async revokeAndMarkBlocked(userId: string, reason?: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
    await User.updateOne(
      { _id: userId },
      { isBlocked: true, blockReason: reason ?? null, blockedAt: new Date() },
    );
    logger.info('All sessions revoked + block reason persisted in auth DB', { userId, reason });
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const user = await User.findOne({
      emailVerifyToken: tokenHash,
      emailVerifyTokenExpiry: { $gt: new Date() },
    }).select('+emailVerifyToken +emailVerifyTokenExpiry');

    if (!user) throw new BadRequestError('Invalid or expired verification code');

    await User.updateOne(
      { _id: user._id },
      {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyTokenExpiry: null,
      },
    );

    logger.info('Email verified', { userId: user._id });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      // Email mavjudligini ochib bermaylik
      return;
    }

    // Per-email rate limit: max 3 reset requests per hour
    try {
      const rateKey = REDIS_KEYS.passwordResetRate(email);
      const count = await this.redis.incr(rateKey);
      if (count === 1) await this.redis.expire(rateKey, 3600);
      if (count > 3) {
        logger.warn('Password reset rate limit exceeded', { email });
        return;
      }
    } catch {
      logger.warn('Redis unavailable — skipping password reset rate check', { email });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = this.hashToken(resetToken);

    await User.updateOne(
      { _id: user._id },
      {
        passwordResetToken: resetTokenHash,
        passwordResetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    );

    logger.info('Password reset requested', { userId: user._id });

    // Password reset xati yuborish — token faqat email orqali
    emailService.sendPasswordResetEmail(email, resetToken).catch((err) =>
      logger.warn('Password reset email failed', { error: (err as Error).message }),
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetTokenExpiry: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetTokenExpiry');

    if (!user) throw new BadRequestError('Invalid or expired password reset token');

    const passwordHash = await this.hashPassword(newPassword);

    await User.updateOne(
      { _id: user._id },
      {
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    );

    // Invalidate all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id.toString() });

    logger.info('Password reset completed', { userId: user._id });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new UnauthorizedError('User not found');

    if (!user.passwordHash) {
      throw new BadRequestError('Password login is not enabled for this account (OAuth only)');
    }

    const isMatch = await this.comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    const passwordHash = await this.hashPassword(newPassword);
    await User.updateOne(
      { _id: userId },
      {
        passwordHash,
        // Clear any pending reset token so it can't be used after password change
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    );

    // Invalidate all refresh tokens — force re-login on other devices
    await RefreshToken.deleteMany({ userId });

    logger.info('Password changed', { userId });
  }

  // Google OAuth / Telegram uchun tokenlar yaratish + refresh tokenni DB ga saqlash
  async generateAndStoreTokens(
    userId: string,
    email: string,
    role: UserRole,
    ip: string | null = null,
    userAgent: string | null = null,
    isEmailVerified = true,
    username?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { userId, email, username, role, isEmailVerified };
    const { accessToken, refreshToken } = this.generateTokens(payload);

    await RefreshToken.create({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.jwt.refreshTokenExpiry),
      ip,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  // OAuth callback uchun short-lived temp code (tokenlarni URL da bermaydi)
  async createOAuthTempCode(accessToken: string, refreshToken: string): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    await this.redis.setex(REDIS_KEYS.oauthCode(code), 120, JSON.stringify({ accessToken, refreshToken })); // 2 daqiqa
    return code;
  }

  async exchangeOAuthCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const raw = await this.redis.get(REDIS_KEYS.oauthCode(code));
    if (!raw) throw new BadRequestError('OAuth code is invalid or expired');
    await this.redis.del(REDIS_KEYS.oauthCode(code)); // one-time use
    return JSON.parse(raw) as { accessToken: string; refreshToken: string };
  }

  async createSuperAdmin(email: string, username: string, password: string): Promise<void> {
    const existing = await User.findOne({ $or: [{ email }, { role: 'superadmin' }] });
    if (existing) {
      throw new ConflictError('Superadmin already exists');
    }
    const passwordHash = await this.hashPassword(password);
    await User.create({
      email,
      username,
      passwordHash,
      role: 'superadmin',
      isEmailVerified: true,
      rank: 'Bronze',
      totalPoints: 0,
      fcmTokens: [],
      bio: '',
      restrictions: [],
      settings: { notifications: {} },
    });
    logger.info('Superadmin created', { email, username });
  }

  // Internal — called by admin service to create/replace staff account
  async createStaffAccount(
    email: string,
    username: string,
    password: string,
    role: 'admin' | 'operator' | 'moderator',
  ): Promise<{ userId: string }> {
    const existingByUsername = await User.findOne({ username, email: { $ne: email } });
    if (existingByUsername) {
      throw new ConflictError(`Username "${username}" is already taken`);
    }

    const passwordHash = await this.hashPassword(password);
    await User.deleteOne({ email });
    await this.redis.del(REDIS_KEYS.loginAttempts(email));

    const created = await User.create({
      email,
      username,
      passwordHash,
      role,
      isEmailVerified: true,
      isBlocked: false,
      rank: 'Bronze',
      totalPoints: 0,
      fcmTokens: [],
      bio: '',
      restrictions: [],
      settings: { notifications: {} },
    });

    const userId = (created._id as object).toString();
    logger.info('Staff account created', { email, username, role, userId });
    return { userId };
  }

  // Creates a ready-to-use regular test account (role 'user') with the email already
  // verified — no OTP flow. Flagged isTestAccount so it can be told apart from real users.
  async createTestUser(
    email: string,
    username: string,
    password: string,
  ): Promise<{ userId: string }> {
    const existingByUsername = await User.findOne({ username, email: { $ne: email } });
    if (existingByUsername) {
      throw new ConflictError(`Username "${username}" is already taken`);
    }

    const passwordHash = await this.hashPassword(password);
    await User.deleteOne({ email });
    await this.redis.del(REDIS_KEYS.loginAttempts(email));

    const created = await User.create({
      email,
      username,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      isTestAccount: true,
      isBlocked: false,
      rank: 'Bronze',
      totalPoints: 0,
      fcmTokens: [],
      bio: '',
      restrictions: [],
      settings: { notifications: {} },
    });

    const userId = (created._id as object).toString();
    logger.info('Test user created', { email, username, userId });
    return { userId };
  }

  async upsertSuperAdmin(email: string, username: string, password: string): Promise<'created' | 'updated'> {
    const passwordHash = await this.hashPassword(password);
    await User.deleteOne({ email, role: { $ne: 'superadmin' } });

    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      await User.updateOne(
        { _id: existing._id },
        { $set: { email, username, passwordHash, isEmailVerified: true } },
      );
      logger.info('Superadmin credentials updated', { email });
      return 'updated';
    } else {
      await User.create({
        email, username, passwordHash, role: 'superadmin', isEmailVerified: true,
        rank: 'Bronze', totalPoints: 0, fcmTokens: [], bio: '', restrictions: [],
        settings: { notifications: {} },
      });
      logger.info('Superadmin created', { email });
      return 'created';
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return; // already deleted — idempotent

    // Revoke all refresh tokens
    await RefreshToken.deleteMany({ userId });

    // Clear brute force locks
    await this.redis.del(REDIS_KEYS.loginAttempts(user.email));

    // Delete user from auth DB
    await User.deleteOne({ _id: userId });

    logger.warn('User deleted from auth DB', { userId, email: user.email });
  }

  async clearLoginAttempts(email: string): Promise<void> {
    try {
      await this.redis.del(REDIS_KEYS.loginAttempts(email));
    } catch {
      logger.warn('Redis unavailable — clearing in-memory login attempts instead', { email });
    }
    // Always clear the fallback too: a successful login must not leave a stale count behind that
    // locks the user out once Redis comes back and the two counters disagree.
    fallbackAttempts.clear(email);
  }

  private async checkBruteForce(email: string): Promise<void> {
    try {
      const attempts = await this.redis.get(REDIS_KEYS.loginAttempts(email));
      if (attempts && parseInt(attempts, 10) >= MAX_LOGIN_ATTEMPTS) {
        throw new TooManyRequestsError('Account locked for 15 minutes due to too many failed attempts');
      }
    } catch (err) {
      if (err instanceof TooManyRequestsError) throw err;
      // Redis down: fall back to the per-instance counter instead of waving every attempt through.
      // This used to log and continue, which meant a Redis outage silently removed brute-force
      // protection entirely — precisely when an attacker would want it gone.
      logger.warn('Redis unavailable for brute force check — using in-memory fallback', { email });
      if (fallbackAttempts.get(email) >= MAX_LOGIN_ATTEMPTS) {
        throw new TooManyRequestsError('Account locked for 15 minutes due to too many failed attempts');
      }
    }
  }

  private async incrementLoginAttempts(email: string): Promise<void> {
    try {
      const attempts = await this.redis.incr(REDIS_KEYS.loginAttempts(email));
      if (attempts === 1) {
        await this.redis.expire(REDIS_KEYS.loginAttempts(email), BLOCK_DURATION_SECONDS);
      }
    } catch {
      logger.warn('Redis unavailable — counting login attempt in memory', { email });
      fallbackAttempts.increment(email);
    }
  }
}
