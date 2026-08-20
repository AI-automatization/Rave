import crypto from 'crypto';
import Redis from 'ioredis';
import { User } from '../../models/user.model';
import { RefreshToken } from '../../models/refreshToken.model';
import { logger } from '@shared/utils/logger';
import { emailService } from '../../utils/email.service';
import { BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';
import { hashPassword, hashToken } from './crypto';

export class PasswordResetService {
  constructor(private redis: Redis) {}

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
    const resetTokenHash = hashToken(resetToken);

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
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetTokenExpiry: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetTokenExpiry');

    if (!user) throw new BadRequestError('Invalid or expired password reset token');

    const passwordHash = await hashPassword(newPassword);

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
}
