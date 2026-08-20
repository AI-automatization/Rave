import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { JwtPayload } from '@shared/types';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(payload, config.jwt.privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.accessTokenExpiry,
  } as jwt.SignOptions);

  const refreshToken = crypto.randomBytes(64).toString('hex');

  return { accessToken, refreshToken };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
