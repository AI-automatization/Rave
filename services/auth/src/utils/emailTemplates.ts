// WeWatch — Branded Email Templates
// Logo is pure HTML/CSS — no external images, works in Gmail/Outlook/Apple Mail.

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#09090F',
  card:      '#0F0E1A',
  cardInner: '#13121F',
  border:    '#1E1C30',
  borderSub: '#161525',
  accent:    '#7C3AED',
  accentLt:  '#A78BFA',
  accentDim: '#4C2A8A',
  text:      '#F4F3FF',
  muted:     '#7C7A9C',
  ghost:     '#3C3A58',
  success:   '#22C55E',
  error:     '#EF4444',
  warn:      '#F59E0B',
};

// ── Logo: real SVG via img tag + text fallback when Gmail blocks images ───────
// Gmail initially blocks external images. After first "Show images" click it
// remembers and loads automatically for all future emails from this sender.
const LOGO_HTML = `
<img src="https://admin.wewatch.uz/logo-email.svg"
     width="168" height="49"
     alt="weWatch"
     style="display:block;border:0;max-width:168px;height:auto;"/>
<div style="display:none;mso-hide:all;">
  <span style="font-size:22px;font-weight:300;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">we</span><span style="font-size:22px;font-weight:800;color:#FFFFFF;font-family:Arial,sans-serif;">Watch</span>
</div>`;

// ── Base layout ───────────────────────────────────────────────────────────────
function base(accentTop: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark light"/>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.bg};-webkit-text-size-adjust:100%;font-family:Arial,Helvetica,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:44px 16px 52px;">

  <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">

    <!-- ─ Logo ─ -->
    <tr>
      <td style="padding-bottom:28px;">
        ${LOGO_HTML}
      </td>
    </tr>

    <!-- ─ Card ─ -->
    <tr>
      <td style="background-color:${C.card};border:1px solid ${C.border};border-radius:18px;overflow:hidden;">

        <!-- accent gradient line -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="height:2px;background-color:transparent;"></td>
            <td width="34%" style="height:2px;background-color:${accentTop};"></td>
            <td width="33%" style="height:2px;background-color:transparent;"></td>
          </tr>
        </table>

        <!-- body -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:40px 44px 44px;">
            ${body}
          </td></tr>
        </table>

        <!-- divider -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="height:1px;background-color:${C.border};"></td></tr>
        </table>

        <!-- footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:20px 44px;">
              <p style="margin:0;font-size:12px;color:${C.ghost};line-height:1.6;">
                © 2025 <a href="https://wewatch.uz" style="color:${C.ghost};text-decoration:none;">WeWatch</a>
                &nbsp;·&nbsp; noreply@wewatch.uz
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#2A2840;">
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
  <tr><td style="height:1px;background-color:${C.border};"></td></tr>
</table>`;

// ── Detail row (for security emails) ─────────────────────────────────────────
function dRow(label: string, value: string, valColor = C.text, small = false): string {
  return `<tr>
    <td style="padding:11px 18px;border-bottom:1px solid ${C.borderSub};width:110px;vertical-align:top;">
      <span style="font-size:12px;color:${C.ghost};font-family:Arial,sans-serif;">${label}</span>
    </td>
    <td style="padding:11px 18px;border-bottom:1px solid ${C.borderSub};vertical-align:top;word-break:break-all;">
      <span style="font-size:${small ? 12 : 13}px;color:${valColor};font-family:Arial,sans-serif;">${value}</span>
    </td>
  </tr>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Verification code
// ═══════════════════════════════════════════════════════════════════════════════
export function verificationEmail(code: string): string {
  const body = `
    <!-- label -->
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.accentLt};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Подтверждение аккаунта
    </p>

    <!-- headline -->
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Подтвердите ваш email
    </h1>

    <!-- description -->
    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Добро пожаловать в WeWatch! Для завершения регистрации введите этот код в приложение.
    </p>

    <!-- code block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background-color:${C.cardInner};border:2px solid ${C.accentDim};border-radius:14px;padding:32px 24px;">
          <p style="margin:0 0 10px;font-size:12px;color:${C.ghost};letter-spacing:0.1em;text-transform:uppercase;font-family:Arial,sans-serif;">Код подтверждения</p>
          <p style="margin:0;font-size:54px;font-weight:900;letter-spacing:14px;color:${C.text};font-family:'Courier New',Courier,monospace;line-height:1;">
            ${code}
          </p>
        </td>
      </tr>
    </table>

    <!-- timer note -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:#1A1030;border-left:3px solid ${C.accent};border-radius:0 8px 8px 0;padding:13px 18px;">
          <p style="margin:0;font-size:13px;color:${C.muted};font-family:Arial,sans-serif;line-height:1.5;">
            ⏱&nbsp; Код действителен <strong style="color:${C.text};">10 минут</strong>.
            Никому не сообщайте его — мы никогда не запрашиваем коды напрямую.
          </p>
        </td>
      </tr>
    </table>

    ${DIV}

    <p style="margin:0;font-size:13px;color:${C.ghost};font-family:Arial,sans-serif;">
      Не регистрировались? Просто проигнорируйте это письмо — аккаунт не будет создан.
    </p>
  `;
  return base(C.accent, body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Password reset
// ═══════════════════════════════════════════════════════════════════════════════
export function passwordResetEmail(resetUrl: string): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.accentLt};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Безопасность аккаунта
    </p>

    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Сброс пароля
    </h1>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Мы получили запрос на сброс пароля для вашего аккаунта WeWatch.
      Нажмите кнопку ниже — ссылка будет активна в течение <strong style="color:${C.text};">10 минут</strong>.
    </p>

    <!-- CTA button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.accent};border-radius:12px;">
          <a href="${resetUrl}"
             style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.01em;">
            Создать новый пароль &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- URL fallback -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:${C.cardInner};border:1px solid ${C.border};border-radius:10px;padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:11px;color:${C.ghost};font-family:Arial,sans-serif;">Если кнопка не открывается, скопируйте ссылку:</p>
          <p style="margin:0;font-size:12px;color:${C.accentLt};word-break:break-all;font-family:'Courier New',Courier,monospace;">${resetUrl}</p>
        </td>
      </tr>
    </table>

    ${DIV}

    <p style="margin:0;font-size:13px;color:${C.ghost};font-family:Arial,sans-serif;">
      Не запрашивали сброс пароля? Кто-то мог ввести ваш email по ошибке.
      Ваш аккаунт в безопасности — просто проигнорируйте это письмо.
    </p>
  `;
  return base(C.accentLt, body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Admin login — self notification
// ═══════════════════════════════════════════════════════════════════════════════
export function adminLoginSelfEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.warn};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Уведомление безопасности
    </p>

    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Вход в Admin Panel
    </h1>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Зафиксирован вход в панель управления WeWatch. Если это были вы — всё в порядке.
    </p>

    <!-- details table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${C.cardInner};border:1px solid ${C.border};border-radius:12px;margin-bottom:28px;overflow:hidden;">
      ${dRow('Аккаунт', opts.adminEmail, C.accentLt)}
      ${dRow('Роль', opts.role)}
      ${dRow('IP-адрес', opts.ip ?? '—')}
      ${dRow('Время (UZT)', opts.time)}
      ${dRow('Устройство', (opts.userAgent ?? '—').slice(0, 90), C.muted, true)}
    </table>

    <!-- warning note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#1A0A0A;border-left:3px solid ${C.error};border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:${C.muted};font-family:Arial,sans-serif;line-height:1.5;">
            <strong style="color:${C.error};">Это не вы?</strong> Немедленно смените пароль и завершите все активные сессии через Admin Panel.
          </p>
        </td>
      </tr>
    </table>
  `;
  return base(C.warn, body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Admin login — superadmin alert
// ═══════════════════════════════════════════════════════════════════════════════
export function adminLoginAlertEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.warn};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Admin Alert
    </p>

    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Вход в панель управления
    </h1>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      Сотрудник выполнил вход в Admin Panel WeWatch.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${C.cardInner};border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
      ${dRow('Аккаунт', opts.adminEmail, C.accentLt)}
      ${dRow('Роль', opts.role)}
      ${dRow('IP-адрес', opts.ip ?? '—')}
      ${dRow('Время (UZT)', opts.time)}
      ${dRow('Устройство', (opts.userAgent ?? '—').slice(0, 90), C.muted, true)}
    </table>
  `;
  return base(C.warn, body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Appeal decision
// ═══════════════════════════════════════════════════════════════════════════════
export function appealDecisionEmail(opts: {
  status: 'approved' | 'rejected'; note?: string;
}): string {
  const ok = opts.status === 'approved';
  const accentColor = ok ? C.success : C.error;
  const label = ok ? '✅ Апелляция одобрена' : '❌ Апелляция отклонена';
  const bodyText = ok
    ? 'Мы внимательно рассмотрели вашу апелляцию и приняли решение восстановить доступ к аккаунту. Вы можете войти в WeWatch снова.'
    : 'Мы внимательно рассмотрели вашу апелляцию. К сожалению, мы не можем восстановить доступ — ограничение остаётся в силе.';

  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">
      Модерация аккаунта
    </p>

    <h1 style="margin:0 0 20px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;font-family:Arial,sans-serif;">
      Решение по апелляции
    </h1>

    <!-- status badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:${accentColor}18;border:1px solid ${accentColor}55;border-radius:10px;padding:11px 20px;">
          <span style="font-size:15px;font-weight:700;color:${accentColor};font-family:Arial,sans-serif;">${label}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;font-family:Arial,sans-serif;">
      ${bodyText}
    </p>

    ${opts.note ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.cardInner};border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:0 10px 10px 0;padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.ghost};text-transform:uppercase;letter-spacing:0.1em;font-family:Arial,sans-serif;">Комментарий модератора</p>
          <p style="margin:0;font-size:14px;color:${C.text};line-height:1.6;font-family:Arial,sans-serif;">${opts.note}</p>
        </td>
      </tr>
    </table>` : ''}

    ${DIV}

    <p style="margin:0;font-size:13px;color:${C.ghost};font-family:Arial,sans-serif;">
      С уважением, команда WeWatch.
    </p>
  `;
  return base(accentColor, body);
}
