import { User } from '../../models/user.model';
import { RefreshToken } from '../../models/refreshToken.model';
import { logger } from '@shared/utils/logger';
import { UnauthorizedError, BadRequestError } from '@shared/utils/errors';
import { hashPassword, comparePassword } from './crypto';

// No Redis dependency — unlike the other flows, changing a password already-known to the
// caller doesn't touch rate limiting or pending-state, so this stays a plain function
// instead of a class with an unused constructor.
export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new UnauthorizedError('User not found');

  if (!user.passwordHash) {
    throw new BadRequestError('Password login is not enabled for this account (OAuth only)');
  }

  const isMatch = await comparePassword(oldPassword, user.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
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
