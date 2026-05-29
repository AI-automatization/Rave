// WeWatch — Notification Service Email Templates
// Matches brand style of services/auth/src/utils/emailTemplates.ts

const C = {
  bg:        '#09090F',
  card:      '#0F0E1A',
  cardInner: '#13121F',
  border:    '#1E1C30',
  accent:    '#7C3AED',
  accentLt:  '#A78BFA',
  accentDim: '#4C2A8A',
  text:      '#F4F3FF',
  muted:     '#7C7A9C',
  ghost:     '#3C3A58',
  success:   '#22C55E',
};

export const LOGO_CID = 'wewatch-logo@wewatch.uz';

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 56" fill="none">
  <defs>
    <linearGradient id="wG" x1="4" y1="6" x2="44" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <path d="M 50,9 L 35,47 L 28,28 L 18,9" stroke="#5B21B6" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 6,9 L 21,47 L 28,28 L 40,9" stroke="url(#wG)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="68" y="39" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="rgba(255,255,255,0.50)" font-weight="300">we</text>
  <text x="103" y="39" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="#FFFFFF" font-weight="800">Watch</text>
</svg>`;

const LOGO_HTML = `<img src="cid:${LOGO_CID}" width="168" height="49" alt="weWatch" style="display:block;border:0;max-width:168px;height:auto;"/>`;

export const LOGO_ATTACHMENT = {
  filename: 'logo.svg',
  content:  Buffer.from(LOGO_SVG),
  cid:      LOGO_CID,
  contentType: 'image/svg+xml',
};

function base(accentTop: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark light"/>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:44px 16px 52px;">
  <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
    <tr><td style="padding-bottom:28px;">${LOGO_HTML}</td></tr>
    <tr>
      <td style="background-color:${C.card};border:1px solid ${C.border};border-radius:18px;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="height:2px;background-color:transparent;"></td>
            <td width="34%" style="height:2px;background-color:${accentTop};"></td>
            <td width="33%" style="height:2px;background-color:transparent;"></td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:40px 44px 44px;">${body}</td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="height:1px;background-color:${C.border};"></td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:20px 44px;">
              <p style="margin:0;font-size:12px;color:${C.ghost};line-height:1.6;">
                © 2025 <a href="https://wewatch.uz" style="color:${C.ghost};text-decoration:none;">WeWatch</a>
                &nbsp;·&nbsp; noreply@wewatch.app
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#2A2840;">Это автоматическое письмо — пожалуйста, не отвечайте на него.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

// ── 1. Android Waitlist Confirmation ─────────────────────────────────────────
export function waitlistConfirmEmail(): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.accentLt};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Android · Soon
    </p>
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Ты в списке! 🎉
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Мы добавили тебя в список ожидания Android версии WeWatch.<br/>
      Как только приложение выйдет — ты узнаешь первым.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.cardInner};border:1px solid ${C.border};border-radius:14px;padding:24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${C.text};font-family:Arial,sans-serif;">Пока ждёшь Android — попробуй iOS:</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color:${C.accent};border-radius:10px;">
                <a href="https://apps.apple.com/app/wewatch"
                   style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">
                  Скачать для iOS →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${C.ghost};font-family:Arial,sans-serif;">
      Команда WeWatch 🎬
    </p>
  `;
  return base(C.success, body);
}

// ── 2. Re-engagement Email ────────────────────────────────────────────────────
export function reengagementEmail(username: string): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.accentLt};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Мы скучаем
    </p>
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      ${username}, твои друзья<br/>смотрят без тебя 👀
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Давно тебя не было в WeWatch. Твои друзья уже запустили Watch Party —<br/>
      возвращайся, посмотрим что-нибудь вместе.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.cardInner};border:1px solid ${C.border};border-radius:14px;padding:24px;">
          <p style="margin:0 0 16px;font-size:13px;color:${C.muted};font-family:Arial,sans-serif;">Что тебя ждёт:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${['🎬 Watch Party — смотри вместе с друзьями', '⚔️ Battle Mode — кто посмотрит больше?', '🏆 25+ достижений — открой новые', '💬 Чат в реальном времени'].map(item => `
            <tr>
              <td style="padding:6px 0;font-size:14px;color:${C.text};font-family:Arial,sans-serif;">${item}</td>
            </tr>`).join('')}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.accent};border-radius:12px;">
          <a href="https://wewatch.uz"
             style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">
            Вернуться в WeWatch →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:${C.ghost};font-family:Arial,sans-serif;line-height:1.6;">
      Не хочешь получать такие письма?
      Отключи email-уведомления в настройках профиля.
    </p>
  `;
  return base(C.accent, body);
}
