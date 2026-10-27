import { randomBytes } from 'crypto';
import { User, IUserDocument } from '../models/user.model';
import { logger } from '@shared/utils/logger';
import { BadRequestError } from '@shared/utils/errors';
import { containsBannedWord } from '@shared/utils/bannedWords';
import { generateUniqueUsername } from './passwordAuth.service';
import { usernameBase } from '../utils/username';

const MIN_USERNAME_LENGTH = 3;
const GUEST_FALLBACK_NAME = 'mehmon';

// Guest accounts let a friend open a shared room link and join with just a name — no email,
// no password, no OTP. They are real User documents (same shape as Telegram users, which also
// have no real email) so every downstream service (watch-party sockets, chat, DMs) works
// unchanged. The account can later be upgraded by binding an email (/auth/email/bind).
export async function createGuestUser(displayName: string): Promise<IUserDocument> {
  const name = displayName.trim();
  if (await containsBannedWord(name)) {
    throw new BadRequestError('This name is not allowed');
  }

  let base = usernameBase(name);
  if (base.length < MIN_USERNAME_LENGTH || base === 'user') base = GUEST_FALLBACK_NAME;
  const username = await generateUniqueUsername(base);
  const email = `guest_${randomBytes(8).toString('hex')}@guest.wewatch.internal`;

  const user = await User.create({
    email,
    username,
    isEmailVerified: true,
    rank: 'Bronze',
    totalPoints: 0,
    fcmTokens: [],
    bio: '',
    restrictions: [],
    settings: { notifications: {} },
  });

  logger.info('Guest user created', { userId: user._id, username });
  return user;
}
