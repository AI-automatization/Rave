import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { User, IUserDocument } from '../models/user.model';
import { logger } from '@shared/utils/logger';
import { UnauthorizedError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';
import { generateUniqueUsername } from './passwordAuth.service';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_AUDIENCE = 'com.wewatch.app';
const JWKS_CACHE_TTL_S = 3600;

interface AppleJWK {
  kty: string; kid: string; use: string; alg: string; n: string; e: string;
}

export interface AppleTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
  iss: string; aud: string | string[]; iat: number; exp: number;
}

export class AppleAuthService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  private async fetchAppleJWKS(): Promise<AppleJWK[]> {
    const cached = await this.redis.get('apple:jwks').catch(() => null);
    if (cached) return (JSON.parse(cached) as { keys: AppleJWK[] }).keys;

    const response = await fetch(APPLE_JWKS_URL);
    if (!response.ok) throw new UnauthorizedError('Failed to fetch Apple public keys');
    const body = await response.json() as { keys: AppleJWK[] };

    await this.redis.setex('apple:jwks', JWKS_CACHE_TTL_S, JSON.stringify(body)).catch(() => null);
    return body.keys;
  }

  async verifyAppleIdToken(identityToken: string): Promise<AppleTokenPayload> {
    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedError('Invalid Apple identity token format');
    }
    const { kid } = decoded.header;

    const keys = await this.fetchAppleJWKS();
    const jwk = keys.find((k) => k.kid === kid);
    if (!jwk) {
      // Cache may be stale — bust and retry once
      await this.redis.del('apple:jwks').catch(() => null);
      const freshKeys = await this.fetchAppleJWKS();
      const retryJwk = freshKeys.find((k) => k.kid === kid);
      if (!retryJwk) throw new UnauthorizedError('Apple public key not found');
      return this.verifyWithJwk(identityToken, retryJwk);
    }
    return this.verifyWithJwk(identityToken, jwk);
  }

  private verifyWithJwk(token: string, jwk: AppleJWK): AppleTokenPayload {
    const publicKey = crypto.createPublicKey({
      key: jwk as unknown as crypto.JsonWebKey,
      format: 'jwk',
    });
    const pem = publicKey.export({ type: 'spki', format: 'pem' });
    try {
      return jwt.verify(token, pem, {
        algorithms: ['RS256'],
        issuer: APPLE_ISSUER,
        audience: APPLE_AUDIENCE,
      }) as AppleTokenPayload;
    } catch {
      throw new UnauthorizedError('Apple identity token verification failed');
    }
  }

  async findOrCreateAppleUser(profile: {
    sub: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<IUserDocument> {
    let user = await User.findOne({ appleId: profile.sub }).select('+appleId');

    if (!user) {
      if (profile.email) {
        const byEmail = await User.findOne({ email: profile.email });
        if (byEmail) {
          user = await User.findOneAndUpdate(
            { _id: byEmail._id },
            { $set: { appleId: profile.sub } },
            { new: true },
          ) ?? byEmail;
        }
      }

      if (!user) {
        // Apple hides email after first login — use private relay placeholder if no email
        const email = profile.email ?? `apple.${profile.sub.slice(-12)}@privaterelay.appleid.com`;
        const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'User';
        const username = await generateUniqueUsername(displayName);
        user = await User.create({
          email,
          username,
          appleId: profile.sub,
          isEmailVerified: !!profile.email,
          rank: 'Bronze',
          totalPoints: 0,
          fcmTokens: [],
          bio: '',
          restrictions: [],
          settings: { notifications: {} },
        });
        logger.info('Apple Sign-In user created', { userId: user._id });
      }
    }

    const redisBlocked = await this.redis.get(REDIS_KEYS.blockedUser(String(user._id))).catch(() => null);
    if (user.isBlocked || redisBlocked !== null) {
      const reason = user.blockReason ?? (redisBlocked !== '1' ? redisBlocked : null) ?? 'No reason provided';
      const err = Object.assign(new Error(reason), {
        statusCode: 403,
        code: 'ACCOUNT_BLOCKED',
        reason,
        userId: String(user._id),
      });
      throw err;
    }

    return user;
  }
}
