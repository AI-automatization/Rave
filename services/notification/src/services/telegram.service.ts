import { logger } from '@shared/utils/logger';
import { config } from '../config/index';

const TG_API = `https://api.telegram.org/bot${config.telegram.botToken}`;

// ── Telegram Bot API helpers ──────────────────────────────────────

interface TgUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name: string; username?: string };
    text?: string;
  };
}

async function tgPost(method: string, body: Record<string, unknown>): Promise<void> {
  if (!config.telegram.botToken) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
    return;
  }
  try {
    const res = await fetch(`${TG_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error('Telegram API error', { method, status: res.status, body: text });
    }
  } catch (err) {
    logger.error('Telegram API request failed', { method, error: (err as Error).message });
  }
}

async function sendMessage(
  chatId: number,
  text: string,
  options?: { parse_mode?: 'HTML' | 'Markdown'; reply_markup?: Record<string, unknown> },
): Promise<void> {
  await tgPost('sendMessage', { chat_id: chatId, text, ...options });
}

// ── Deep link URL builders ────────────────────────────────────────

const buildTelegramDeepLink = (inviteCode: string): string =>
  `https://t.me/${config.telegram.botUsername}?start=room_${inviteCode}`;

const buildMobileDeepLink = (inviteCode: string): string =>
  `${config.telegram.appScheme}://join/${inviteCode}`;

const buildWebJoinLink = (inviteCode: string): string =>
  `${config.telegram.webBaseUrl}/join/${inviteCode}`;

// ── Share link generator (called by mobile/web) ───────────────────
// Returns the Telegram deep link to share in chat
export const getShareLink = (inviteCode: string): string =>
  buildTelegramDeepLink(inviteCode);

// ── Forward auth messages to auth service ────────────────────────
// T-S063 registered this webhook → auth service no longer receives updates.
// Messages starting with "/start auth_" belong to the auth Telegram login flow.

const forwardToAuth = async (update: TgUpdate): Promise<void> => {
  const authUrl = config.telegram.authServiceUrl;
  const secret  = config.telegram.webhookSecret;
  try {
    await fetch(`${authUrl}/api/v1/auth/telegram/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-telegram-bot-api-secret-token': secret } : {}),
      },
      body: JSON.stringify(update),
    });
  } catch (err) {
    logger.error('Failed to forward Telegram auth update to auth service', { error: (err as Error).message });
  }
};

// ── Webhook update handler ────────────────────────────────────────

export const handleTelegramUpdate = async (update: TgUpdate): Promise<void> => {
  const msg = update.message;
  if (!msg?.text) return;

  const chatId = msg.chat.id;
  const text   = msg.text.trim();
  const from   = msg.from?.first_name ?? 'Friend';

  // /start auth_{state} — Telegram login flow (belongs to auth service)
  if (text.startsWith('/start auth_')) {
    await forwardToAuth(update);
    return;
  }

  // /start room_{inviteCode}  — Telegram deep link click
  if (text.startsWith('/start room_')) {
    const inviteCode = text.replace('/start room_', '').trim().toUpperCase();

    // Basic invite code format: 6 hex chars
    if (!/^[A-F0-9]{6}$/.test(inviteCode)) {
      await sendMessage(chatId, '❌ Invalid invite link.');
      return;
    }

    const mobileLink = buildMobileDeepLink(inviteCode);
    const webLink    = buildWebJoinLink(inviteCode);

    await sendMessage(
      chatId,
      `🎬 <b>You've been invited to a Watch Party!</b>\n\n` +
      `Invite code: <code>${inviteCode}</code>\n\n` +
      `Open the app to join and watch together:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '📱 Open App', url: mobileLink },
            { text: '🌐 Web', url: webLink },
          ]],
        },
      },
    );

    logger.info('Telegram deep link handled', { chatId, inviteCode });
    return;
  }

  // /start (plain) — welcome message
  if (text === '/start') {
    await sendMessage(
      chatId,
      `👋 Hi <b>${from}</b>! Welcome to <b>Rave Bot</b>.\n\n` +
      `🎬 Rave lets you watch videos in sync with friends.\n\n` +
      `To join a Watch Party:\n` +
      `→ Ask your friend to share a room link\n` +
      `→ Click the link — I'll guide you in!\n\n` +
      `<i>Or open the Rave app to create your own room.</i>`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  // Unknown command — help
  await sendMessage(
    chatId,
    `ℹ️ Share a Watch Party invite link to join a room.\n` +
    `Example: ask your friend to tap "Share" in the Rave app.`,
  );
};

// ── Webhook registration (call once on server start) ─────────────

export const registerWebhook = async (webhookUrl: string): Promise<void> => {
  if (!config.telegram.botToken) return;

  const body: Record<string, unknown> = { url: webhookUrl };
  if (config.telegram.webhookSecret) {
    body.secret_token = config.telegram.webhookSecret;
  }

  await tgPost('setWebhook', body);
  logger.info('Telegram webhook registered', { url: webhookUrl });
};
