import { OAuth2Client } from 'google-auth-library';
import { User, IUserDocument } from '../models/user.model';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';
import { UnauthorizedError } from '@shared/utils/errors';
import { generateUniqueUsername, syncUserProfileWithRetry } from './passwordAuth.service';

export class GoogleAuthService {
  // Constructor accepts passwordAuth for potential future delegation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_passwordAuth?: unknown) {}

  async verifyGoogleIdToken(idToken: string): Promise<{
    id: string;
    email: string;
    displayName: string;
    picture: string;
  }> {
    // Accept both Web and Android client IDs as valid audiences (BUG #14 fix)
    const audiences = [config.google.clientId, config.google.androidClientId].filter(Boolean);
    const client = new OAuth2Client(config.google.clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: audiences,
      });
    } catch {
      throw new UnauthorizedError('Invalid Google ID token');
    }
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedError('Invalid Google ID token');
    }
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.name ?? payload.email.split('@')[0],
      picture: payload.picture ?? '',
    };
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
        const username = await generateUniqueUsername(profile.displayName);
        user = await User.create({
          email: profile.email,
          username,
          googleId: profile.id,
          avatar: profile.picture,
          isEmailVerified: true,
        });
        logger.info('Google OAuth user created', { userId: user._id, email: profile.email });

        // User service ga profil yaratish
        void syncUserProfileWithRetry(user._id.toString(), profile.email, username);
      }
    }

    if (user.isBlocked) {
      const reason = user.blockReason ?? 'No reason provided';
      const err = new Error(reason) as Error & { statusCode: number; code: string; reason: string };
      err.statusCode = 403;
      err.code = 'ACCOUNT_BLOCKED';
      err.reason = reason;
      throw err;
    }

    // Auto-heal: ensure profile exists in user service on every login
    void syncUserProfileWithRetry(user._id.toString(), user.email, user.username);

    return user;
  }
}
