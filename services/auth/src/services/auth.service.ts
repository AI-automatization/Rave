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
} from '@shared/utils/errors';
import { JwtPayload, UserRole } from '@shared/types';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

export class AuthService {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

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

  async register(email: string, username: string, password: string): Promise<IUserDocument> {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new ConflictError(
        existing.email === email ? 'Email already registered' : 'Username already taken',
      );
    }

    const passwordHash = await this.hashPassword(password);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      email,
      username,
      passwordHash,
      emailVerifyToken: this.hashToken(emailVerifyToken),
      emailVerifyTokenExpiry,
    });

    logger.info('User registered', { userId: user._id, email });

    // User Service da profil yaratish (async — xato bo'lsa ham register muvaffaqiyatli)
    this.syncUserProfile(user._id.toString(), email, username).catch((err) =>
      logger.warn('User profile sync failed', { error: (err as Error).message }),
    );

    // Email verification xati yuborish
    emailService.sendVerificationEmail(email, emailVerifyToken).catch((err) =>
      logger.warn('Verification email failed', { error: (err as Error).message }),
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

    if (user.isBlocked) {
      throw new UnauthorizedError('Account is blocked. Please contact support.');
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await this.incrementLoginAttempts(email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Clear brute force counter on success
    await this.redis.del(`login_attempts:${email}`);

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role as UserRole,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    await RefreshToken.create({
      userId: user._id.toString(),
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.jwt.refreshTokenExpiry),
      ip,
      userAgent,
    });

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    logger.info('User logged in', { userId: user._id });
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
    if (!user || user.isBlocked) {
      throw new UnauthorizedError('User not found or blocked');
    }

    // Rotate — delete old, create new
    await RefreshToken.deleteOne({ _id: stored._id });

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role as UserRole,
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

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const user = await User.findOne({
      emailVerifyToken: tokenHash,
      emailVerifyTokenExpiry: { $gt: new Date() },
    }).select('+emailVerifyToken +emailVerifyTokenExpiry');

    if (!user) throw new BadRequestError('Invalid or expired email verification token');

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

  async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email });
    if (!user) {
      // Email mavjudligini ochib bermaylik
      return '';
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

    // Password reset xati yuborish
    emailService.sendPasswordResetEmail(email, resetToken).catch((err) =>
      logger.warn('Password reset email failed', { error: (err as Error).message }),
    );

    return resetToken;
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

  async findOrCreateGoogleUser(profile: {
    id: string;
    email: string;
    displayName: string;
    picture: string;
  }): Promise<IUserDocument> {
    let user = await User.findOne({ googleId: profile.id }).select('+googleId');

    if (!user) {
      user = await User.findOne({ email: profile.email });
      if (user) {
        await User.updateOne({ _id: user._id }, { googleId: profile.id });
      } else {
        const username = await this.generateUniqueUsername(profile.displayName);
        user = await User.create({
          email: profile.email,
          username,
          googleId: profile.id,
          avatar: profile.picture,
          isEmailVerified: true,
        });
        logger.info('Google OAuth user created', { userId: user._id, email: profile.email });

        // User service ga profil yaratish
        this.syncUserProfile(user._id.toString(), profile.email, username).catch((err) =>
          logger.warn('Google user profile sync failed', { error: (err as Error).message }),
        );
      }
    }

    return user;
  }

  private async syncUserProfile(authId: string, email: string, username: string): Promise<void> {
    const url = `${config.userServiceUrl}/internal/profile`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authId, email, username }),
    });
    if (!response.ok) {
      throw new Error(`User service responded with ${response.status}`);
    }
    logger.info('User profile synced to user service', { authId });
  }

  private async generateUniqueUsername(displayName: string): Promise<string> {
    const base = displayName.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || 'user';
    let username = base;
    let suffix = 1;

    while (await User.findOne({ username })) {
      username = `${base}${suffix++}`;
    }

    return username;
  }

  private async checkBruteForce(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    const attempts = await this.redis.get(key);
    if (attempts && parseInt(attempts, 10) >= MAX_LOGIN_ATTEMPTS) {
      throw new TooManyRequestsError('Account locked for 15 minutes due to too many failed attempts');
    }
  }

  private async incrementLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, BLOCK_DURATION_SECONDS);
    }
  }
}
