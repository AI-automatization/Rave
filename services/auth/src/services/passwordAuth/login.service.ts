import crypto from 'crypto';
import Redis from 'ioredis';
import { User, IUserDocument } from '../../models/user.model';
import { RefreshToken } from '../../models/refreshToken.model';
import { config } from '../../config/index';
import { logger } from '@shared/utils/logger';
import { emailService } from '../../utils/email.service';
import { UnauthorizedError, BadRequestError } from '@shared/utils/errors';
import { JwtPayload, UserRole } from '@shared/types';
import { REDIS_KEYS } from '@shared/constants';
import { comparePassword, generateTokens, hashToken } from './crypto';
import { checkBruteForce, incrementLoginAttempts, clearLoginAttempts } from './bruteForce';

export class LoginService {
  constructor(private redis: Redis) {}

  async login(
    email: string,
    password: string,
    ip: string | null,
    userAgent: string | null,
  ): Promise<{ accessToken: string; refreshToken: string; user: IUserDocument }> {
    // Brute force check
    await checkBruteForce(this.redis, email);

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      await incrementLoginAttempts(this.redis, email);
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

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await incrementLoginAttempts(this.redis, email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Clear brute force counter on success
    await clearLoginAttempts(this.redis, email);

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified,
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    await RefreshToken.create({
      userId: user._id.toString(),
      tokenHash: hashToken(refreshToken),
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
    const tokenHash = hashToken(rawRefreshToken);
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

    const { accessToken, refreshToken } = generateTokens(payload);

    await RefreshToken.create({
      userId: user._id.toString(),
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.jwt.refreshTokenExpiry),
      ip,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
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
    const tokenHash = hashToken(token);
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
    const { accessToken, refreshToken } = generateTokens(payload);

    await RefreshToken.create({
      userId,
      tokenHash: hashToken(refreshToken),
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
}
