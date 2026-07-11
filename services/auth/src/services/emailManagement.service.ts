import crypto from 'crypto';
import Redis from 'ioredis';
import { User, IUserDocument } from '../models/user.model';
import { logger } from '@shared/utils/logger';
import { emailService } from '../utils/email.service';
import { BadRequestError, ConflictError } from '@shared/utils/errors';
import { config } from '../config/index';
import { REDIS_KEYS, isPlaceholderEmail } from '@shared/constants';

interface PendingEmailBind {
  email: string;
  otpHash: string;
}

// ─── EmailManagementService ─────────────────────────────────────────────────
// Handles the "bind email" flow (Telegram-login users with a synthetic
// placeholder email attaching a real one) and the "change email" flow
// (users who already have a real email). Both share the same OTP mechanics
// as PasswordAuthService.initiateRegistration/confirmRegistration, just
// scoped to an already-authenticated userId instead of an anonymous signup.

export class EmailManagementService {
  constructor(private redis: Redis) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError('Email is already in use');
  }

  private async issueOtp(userId: string, newEmail: string): Promise<string | null> {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP

    const pending: PendingEmailBind = { email: newEmail, otpHash: this.hashToken(code) };
    await this.redis.setex(REDIS_KEYS.emailBind(userId), 600, JSON.stringify(pending));

    emailService.sendVerificationEmail(newEmail, code).catch((err) =>
      logger.warn('Email bind/change verification email failed', { error: (err as Error).message }),
    );

    logger.info('Email bind/change OTP issued', { userId, newEmail });

    // Dev mode: return code directly so it can be included in response
    return config.nodeEnv !== 'production' ? code : null;
  }

  // Telegram-login user (synthetic placeholder email) attaches a real email for the first time.
  async initBindEmail(userId: string, newEmail: string): Promise<string | null> {
    const user = await User.findById(userId);
    if (!user) throw new BadRequestError('User not found');

    if (!isPlaceholderEmail(user.email)) {
      throw new ConflictError('Email already set — use change email');
    }

    const email = newEmail.toLowerCase().trim();
    await this.assertEmailAvailable(email);

    return this.issueOtp(userId, email);
  }

  // User with an existing real email wants to replace it with a new one.
  async initChangeEmail(userId: string, newEmail: string): Promise<string | null> {
    const user = await User.findById(userId);
    if (!user) throw new BadRequestError('User not found');

    if (isPlaceholderEmail(user.email)) {
      throw new BadRequestError('No email to change — use bind email');
    }

    const email = newEmail.toLowerCase().trim();
    await this.assertEmailAvailable(email);

    return this.issueOtp(userId, email);
  }

  // Confirms either flow with the 6-digit OTP sent to the pending new email.
  async verifyEmail(userId: string, otp: string): Promise<IUserDocument> {
    const raw = await this.redis.get(REDIS_KEYS.emailBind(userId));
    if (!raw) throw new BadRequestError('Code expired or not found. Please request a new one.');

    const pending = JSON.parse(raw) as PendingEmailBind;

    if (pending.otpHash !== this.hashToken(otp)) {
      throw new BadRequestError('Invalid code');
    }

    // Another account may have taken the pending email in the meantime
    await this.assertEmailAvailable(pending.email);

    const user = await User.findById(userId);
    if (!user) throw new BadRequestError('User not found');

    user.email = pending.email;
    user.isEmailVerified = true;
    user.emailBoundAt = new Date();
    await user.save();

    await this.redis.del(REDIS_KEYS.emailBind(userId));

    logger.info('Email bound/changed successfully', { userId, email: pending.email });

    return user;
  }
}
