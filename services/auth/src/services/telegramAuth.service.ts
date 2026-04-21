import crypto from 'crypto';
import Redis from 'ioredis';
import { User, IUserDocument } from '../models/user.model';
import { logger } from '@shared/utils/logger';
import { UnauthorizedError } from '@shared/utils/errors';
import { UserRole } from '@shared/types';
import { REDIS_KEYS } from '@shared/constants';
import { PasswordAuthService, generateUniqueUsername, syncUserProfileWithRetry } from './passwordAuth.service';

export class TelegramAuthService {
  constructor(
    private redis: Redis,
    private passwordAuth: PasswordAuthService,
  ) {}

  async initTelegramAuth(): Promise<{ state: string; botUrl: string }> {
    const state = crypto.randomBytes(16).toString('hex');
    await this.redis.setex(REDIS_KEYS.tgState(state), 300, '1'); // 5 daqiqa TTL
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
    const botUrl = `https://t.me/${botUsername}?start=${state}`;
    return { state, botUrl };
  }

  // Telegram Login Widget / OAuth data → hash verify → JWT
  async loginWithTelegramData(data: {
    id: string;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: string;
    hash: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: IUserDocument }> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

    // auth_date freshness check (5 daqiqadan eski bo'lsa reject)
    const authAge = Math.floor(Date.now() / 1000) - parseInt(data.auth_date, 10);
    if (authAge > 300) throw new UnauthorizedError('Telegram auth data expired');

    // Hash verification (official Telegram Login algorithm)
    const { hash, ...fields } = data;
    const checkString = Object.entries(fields)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (expectedHash !== hash) throw new UnauthorizedError('Invalid Telegram auth data');

    const user = await this.findOrCreateTelegramUser({
      id: data.id,
      username: data.username ?? `tg_${data.id}`,
      firstName: data.first_name,
      photoUrl: data.photo_url,
    });

    const { accessToken, refreshToken } = await this.passwordAuth.generateAndStoreTokens(
      user._id.toString(),
      user.email,
      user.role as UserRole,
      null,
      'Telegram Login',
    );

    logger.info('Telegram login successful', { userId: user._id, telegramId: data.id });
    return { accessToken, refreshToken, user };
  }

  async handleTelegramWebhook(update: {
    message?: {
      text?: string;
      chat: { id: number };
      from: { id: number; username?: string; first_name: string };
    };
  }): Promise<void> {
    const msg = update.message;
    if (!msg?.text?.startsWith('/start')) return;

    const from = msg.from;
    const telegramId = String(from.id);
    const chatId = msg.chat.id;
    const param = msg.text.slice(6).trim(); // /start <param>

    // Case 1: /start STATE — polling flow (old method, still supported)
    if (param) {
      const stateData = await this.redis.get(REDIS_KEYS.tgState(param));
      if (stateData) {
        const user = await this.findOrCreateTelegramUser({
          id: telegramId,
          username: from.username ?? `tg_${telegramId}`,
          firstName: from.first_name,
        });

        const { accessToken, refreshToken } = await this.passwordAuth.generateAndStoreTokens(
          user._id.toString(),
          user.email,
          user.role as UserRole,
          null,
          'Telegram Bot',
        );

        await this.redis.del(REDIS_KEYS.tgState(param));
        await this.redis.setex(
          REDIS_KEYS.tgAuth(param),
          300,
          JSON.stringify({ accessToken, refreshToken, user }),
        );

        await this.sendTelegramMessage(chatId, '✅ Muvaffaqiyatli autentifikatsiya! Ilovaga qaytishingiz mumkin.');
        logger.info('Telegram polling auth completed', { userId: user._id, telegramId });
        return;
      }

      // Case 2: /start APP_USER_ID — notification linking (after login)
      // Validate ObjectId format before findById to prevent injection
      if (!/^[a-f0-9]{24}$/i.test(param)) return;
      const appUser = await User.findById(param).select('+telegramId');
      if (appUser) {
        await User.updateOne({ _id: appUser._id }, { telegramId });
        await this.sendTelegramMessage(
          chatId,
          '✅ Akkаunt muvaffaqiyatli bog\'landi. Endi ilova bildirishnomalari Telegram orqali keladi.',
        );
        logger.info('Telegram notification linked', { userId: appUser._id, telegramId });
        return;
      }
    }

    // Case 3: plain /start — welcome message
    await this.sendTelegramMessage(chatId, '👋 CineSync botiga xush kelibsiz! Ilovadan kirish tugmasini bosing.');
  }

  async pollTelegramAuth(state: string): Promise<{ accessToken: string; refreshToken: string; user: IUserDocument } | null> {
    const raw = await this.redis.get(REDIS_KEYS.tgAuth(state));
    if (!raw) return null;
    await this.redis.del(REDIS_KEYS.tgAuth(state));
    return JSON.parse(raw) as { accessToken: string; refreshToken: string; user: IUserDocument };
  }

  async findOrCreateTelegramUser(profile: {
    id: string;
    username: string;
    firstName: string;
    photoUrl?: string;
  }): Promise<IUserDocument> {
    let user = await User.findOne({ telegramId: profile.id }).select('+telegramId');

    if (!user) {
      const username = await generateUniqueUsername(profile.username);
      const email = `tg_${profile.id}@telegram.cinesync.internal`;

      user = await User.create({
        email,
        username,
        telegramId: profile.id,
        avatar: profile.photoUrl ?? null,
        isEmailVerified: true,
      });

      logger.info('Telegram user created', { userId: user._id, telegramId: profile.id });

      void syncUserProfileWithRetry(user._id.toString(), email, username);
    } else {
      // Auto-heal: ensure profile exists in user service on every login
      void syncUserProfileWithRetry(user._id.toString(), user.email, user.username);
    }

    return user;
  }

  private async sendTelegramMessage(chatId: number, text: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) logger.warn('Telegram sendMessage failed', { chatId, status: res.status });
    } catch (err) {
      logger.warn('Telegram sendMessage error', { error: (err as Error).message });
    }
  }
}
