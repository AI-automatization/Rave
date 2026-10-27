import Redis from 'ioredis';
import { User, IUserDocument } from '../../models/user.model';
import { config } from '../../config/index';
import { logger } from '@shared/utils/logger';
import { emailService } from '../../utils/email.service';
import { ConflictError, BadRequestError, ForbiddenError } from '@shared/utils/errors';
import { containsBannedWord } from '@shared/utils/bannedWords';
import { getAppSetting } from '@shared/utils/appSettings';
import { REDIS_KEYS } from '@shared/constants';
import { hashPassword, hashToken } from './crypto';
import { usernameBase } from '../../utils/username';

export async function generateUniqueUsername(displayName: string): Promise<string> {
  const base = usernameBase(displayName);
  if (!(await User.exists({ username: base }))) return base;

  // Random suffix instead of counting 1,2,3…: with many "user" accounts the old loop made
  // one DB query per existing name and could time out the sign-in.
  for (let i = 0; i < 10; i++) {
    const digits = i < 5 ? 4 : 5;
    const n = Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1));
    const candidate = `${base}${n}`;
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  return `user${Date.now().toString(36)}`.slice(0, 20);
}

export class RegisterService {
  constructor(private redis: Redis) {}

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

    const passwordHash = await hashPassword(password);
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP

    const pending = JSON.stringify({
      username,
      passwordHash,
      otpHash: hashToken(code),
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

    const updated = JSON.stringify({ ...pending, otpHash: hashToken(code) });
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

    if (pending.otpHash !== hashToken(code)) {
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
}
