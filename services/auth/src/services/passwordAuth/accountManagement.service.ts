import Redis from 'ioredis';
import { User } from '../../models/user.model';
import { RefreshToken } from '../../models/refreshToken.model';
import { logger } from '@shared/utils/logger';
import { ConflictError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';
import { hashPassword } from './crypto';

// Admin/seed account operations — creating staff, superadmin and test accounts, and hard
// account deletion. Doesn't fit the register/login/reset/change-password end-user flows,
// so it gets its own file rather than being forced into one of those.
export class AccountManagementService {
  constructor(private redis: Redis) {}

  async createSuperAdmin(email: string, username: string, password: string): Promise<void> {
    const existing = await User.findOne({ $or: [{ email }, { role: 'superadmin' }] });
    if (existing) {
      throw new ConflictError('Superadmin already exists');
    }
    const passwordHash = await hashPassword(password);
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

    const passwordHash = await hashPassword(password);
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

    const passwordHash = await hashPassword(password);
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
    const passwordHash = await hashPassword(password);
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
}
