// WeWatch — Branded Email Templates
// Logo is embedded via CID attachment (inline) — always visible in Gmail/Outlook/Apple Mail,
// no "Show images" click needed. Minimalist design: white background, no colored call-out
// boxes — the logo is the only branded color on the page.

export const LOGO_CID = 'wewatch-logo@wewatch.uz';

// PNG (not SVG) — SVG inline attachments render unreliably in Outlook/older clients.
// Base64 keeps the asset self-contained in source (no separate file for the build to copy).
export const LOGO_PNG_BASE64 =
  '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';

// ── Design tokens — monochrome; the logo image is the only source of color ────
const C = {
  bg:     '#FFFFFF',
  border: '#E7E7EC',
  line:   '#F1F1F5',
  text:   '#18181B',
  muted:  '#6B7280',
  faint:  '#9CA3AF',
  soft:   '#FAFAFA',
};

// ── Logo: CID-embedded image (always visible, no external URL) ────────────────
const LOGO_HTML = `
<img src="cid:${LOGO_CID}" width="164" height="41" alt="weWatch"
     style="display:block;border:0;max-width:164px;height:auto;"/>`;

// ── Base layout ───────────────────────────────────────────────────────────────
function base(body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.bg};-webkit-text-size-adjust:100%;font-family:Arial,Helvetica,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:44px 16px 52px;">

  <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

    <!-- ─ Logo ─ -->
    <tr>
      <td align="center" style="padding-bottom:32px;">
        ${LOGO_HTML}
      </td>
    </tr>

    <!-- ─ Card ─ -->
    <tr>
      <td style="background-color:${C.bg};border:1px solid ${C.border};border-radius:14px;overflow:hidden;">

        <!-- body -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:40px 44px 44px;">
            ${body}
          </td></tr>
        </table>

        <!-- divider -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="height:1px;background-color:${C.line};"></td></tr>
        </table>

        <!-- footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:20px 44px;">
              <p style="margin:0;font-size:12px;color:${C.faint};line-height:1.6;">
                © 2025 <a href="https://wewatch.uz" style="color:${C.faint};text-decoration:none;">WeWatch</a>
                &nbsp;·&nbsp; noreply@wewatch.uz
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#C4C4CE;">
                Это автоматическое письмо — пожалуйста, не отвечайте на него.
              </p>
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

// ── Divider helper ────────────────────────────────────────────────────────────
const DIV = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr><td style="height:1px;background-color:${C.line};"></td></tr>
</table>`;

// ── Detail row (for security emails) ─────────────────────────────────────────
function dRow(label: string, value: string, small = false): string {
  return `<tr>
    <td style="padding:11px 18px;border-bottom:1px solid ${C.line};width:110px;vertical-align:top;">
      <span style="font-size:12px;color:${C.faint};font-family:Arial,sans-serif;">${label}</span>
    </td>
    <td style="padding:11px 18px;border-bottom:1px solid ${C.line};vertical-align:top;word-break:break-all;">
      <span style="font-size:${small ? 12 : 13}px;color:${C.text};font-family:Arial,sans-serif;">${value}</span>
    </td>
  </tr>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Verification code
// ═══════════════════════════════════════════════════════════════════════════════
export function verificationEmail(code: string): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.faint};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Подтверждение аккаунта
    </p>

    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Подтвердите ваш email
    </h1>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Добро пожаловать в WeWatch! Для завершения регистрации введите этот код в приложение.
    </p>

    <!-- code block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background-color:${C.soft};border:1px solid ${C.border};border-radius:12px;padding:32px 24px;">
          <p style="margin:0 0 10px;font-size:12px;color:${C.faint};letter-spacing:0.1em;text-transform:uppercase;font-family:Arial,sans-serif;">Код подтверждения</p>
          <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:${C.text};font-family:'Courier New',Courier,monospace;line-height:1;">
            ${code}
          </p>
        </td>
      </tr>
    </table>

    <!-- timer note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:${C.soft};border:1px solid ${C.border};border-radius:8px;padding:13px 18px;">
          <p style="margin:0;font-size:13px;color:${C.muted};font-family:Arial,sans-serif;line-height:1.5;">
            Код действителен <strong style="color:${C.text};">10 минут</strong>.
            Никому не сообщайте его — мы никогда не запрашиваем коды напрямую.
          </p>
        </td>
      </tr>
    </table>

    ${DIV}

    <p style="margin:0;font-size:13px;color:${C.faint};font-family:Arial,sans-serif;">
      Не регистрировались? Просто проигнорируйте это письмо — аккаунт не будет создан.
    </p>
  `;
  return base(body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Password reset
// ═══════════════════════════════════════════════════════════════════════════════
export function passwordResetEmail(resetUrl: string): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.faint};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Безопасность аккаунта
    </p>

    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Сброс пароля
    </h1>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Мы получили запрос на сброс пароля для вашего аккаунта WeWatch.
      Нажмите кнопку ниже — ссылка будет активна в течение <strong style="color:${C.text};">10 минут</strong>.
    </p>

    <!-- CTA button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.text};border-radius:10px;">
          <a href="${resetUrl}"
             style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.01em;">
            Создать новый пароль &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- URL fallback -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:${C.soft};border:1px solid ${C.border};border-radius:10px;padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:11px;color:${C.faint};font-family:Arial,sans-serif;">Если кнопка не открывается, скопируйте ссылку:</p>
          <p style="margin:0;font-size:12px;color:${C.muted};word-break:break-all;font-family:'Courier New',Courier,monospace;">${resetUrl}</p>
        </td>
      </tr>
    </table>

    ${DIV}

    <p style="margin:0;font-size:13px;color:${C.faint};font-family:Arial,sans-serif;">
      Не запрашивали сброс пароля? Кто-то мог ввести ваш email по ошибке.
      Ваш аккаунт в безопасности — просто проигнорируйте это письмо.
    </p>
  `;
  return base(body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Admin login — self notification
// ═══════════════════════════════════════════════════════════════════════════════
export function adminLoginSelfEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.faint};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Уведомление безопасности
    </p>

    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Вход в Admin Panel
    </h1>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Зафиксирован вход в панель управления WeWatch. Если это были вы — всё в порядке.
    </p>

    <!-- details table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${C.soft};border:1px solid ${C.border};border-radius:10px;margin-bottom:28px;overflow:hidden;">
      ${dRow('Аккаунт', opts.adminEmail)}
      ${dRow('Роль', opts.role)}
      ${dRow('IP-адрес', opts.ip ?? '—')}
      ${dRow('Время (UZT)', opts.time)}
      ${dRow('Устройство', (opts.userAgent ?? '—').slice(0, 90), true)}
    </table>

    <!-- warning note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:${C.soft};border:1px solid ${C.border};border-radius:8px;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:${C.muted};font-family:Arial,sans-serif;line-height:1.5;">
            <strong style="color:${C.text};">Это не вы?</strong> Немедленно смените пароль и завершите все активные сессии через Admin Panel.
          </p>
        </td>
      </tr>
    </table>
  `;
  return base(body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Admin login — superadmin alert
// ═══════════════════════════════════════════════════════════════════════════════
export function adminLoginAlertEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.faint};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Admin Alert
    </p>

    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Вход в панель управления
    </h1>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Сотрудник выполнил вход в Admin Panel WeWatch.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${C.soft};border:1px solid ${C.border};border-radius:10px;overflow:hidden;">
      ${dRow('Аккаунт', opts.adminEmail)}
      ${dRow('Роль', opts.role)}
      ${dRow('IP-адрес', opts.ip ?? '—')}
      ${dRow('Время (UZT)', opts.time)}
      ${dRow('Устройство', (opts.userAgent ?? '—').slice(0, 90), true)}
    </table>
  `;
  return base(body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Appeal decision
// ═══════════════════════════════════════════════════════════════════════════════
export function appealDecisionEmail(opts: {
  status: 'approved' | 'rejected'; note?: string;
}): string {
  const ok = opts.status === 'approved';
  const label = ok ? 'Апелляция одобрена' : 'Апелляция отклонена';
  const bodyText = ok
    ? 'Мы внимательно рассмотрели вашу апелляцию и приняли решение восстановить доступ к аккаунту. Вы можете войти в WeWatch снова.'
    : 'Мы внимательно рассмотрели вашу апелляцию. К сожалению, мы не можем восстановить доступ — ограничение остаётся в силе.';

  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.faint};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Модерация аккаунта
    </p>

    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Решение по апелляции
    </h1>

    <p style="margin:0 0 24px;font-size:15px;font-weight:700;color:${C.text};font-family:Arial,sans-serif;">
      ${label}
    </p>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      ${bodyText}
    </p>

    ${opts.note ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.soft};border:1px solid ${C.border};border-radius:10px;padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.faint};text-transform:uppercase;letter-spacing:0.1em;font-family:Arial,sans-serif;">Комментарий модератора</p>
          <p style="margin:0;font-size:14px;color:${C.text};line-height:1.6;font-family:Arial,sans-serif;">${opts.note}</p>
        </td>
      </tr>
    </table>` : ''}

    ${DIV}

    <p style="margin:0;font-size:13px;color:${C.faint};font-family:Arial,sans-serif;">
      С уважением, команда WeWatch.
    </p>
  `;
  return base(body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Welcome email (sent after email confirmation)
// ═══════════════════════════════════════════════════════════════════════════════
export function welcomeEmail(username: string): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.faint};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Добро пожаловать
    </p>

    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Привет, ${username}!
    </h1>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Твой аккаунт WeWatch готов. Теперь ты можешь смотреть YouTube, VK и Rutube
      вместе с друзьями — в реальном времени, бесплатно.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.soft};border:1px solid ${C.border};border-radius:12px;padding:24px;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${C.text};font-family:Arial,sans-serif;">С чего начать:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:5px 0;font-size:14px;color:${C.muted};font-family:Arial,sans-serif;">
              <span style="color:${C.text};font-weight:700;">1.</span>&nbsp;
              Открой браузер в приложении
            </td></tr>
            <tr><td style="padding:5px 0;font-size:14px;color:${C.muted};font-family:Arial,sans-serif;">
              <span style="color:${C.text};font-weight:700;">2.</span>&nbsp;
              Найди видео на YouTube, VK или Rutube
            </td></tr>
            <tr><td style="padding:5px 0;font-size:14px;color:${C.muted};font-family:Arial,sans-serif;">
              <span style="color:${C.text};font-weight:700;">3.</span>&nbsp;
              Создай комнату и пошли ссылку другу
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.text};border-radius:10px;">
          <a href="https://wewatch.uz"
             style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">
            Открыть WeWatch →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${C.faint};font-family:Arial,sans-serif;">
      Рады видеть тебя в команде WeWatch.
    </p>
  `;
  return base(body);
}
