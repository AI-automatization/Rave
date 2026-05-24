// WeWatch — Branded Email Templates
// All templates share a base layout with the WeWatch W mark logo.
// Logo is embedded as base64 SVG data URI — works in Gmail, Apple Mail, Outlook Web.

const LOGO_B64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ijg4IDExMyAyMjQgMTcwIiBmaWxsPSJub25lIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0id0ciIHgxPSI4OCIgeTE9IjExMyIgeDI9IjI1MCIgeTI9IjI4MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjQTc4QkZBIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzdDM0FFRCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHBhdGggZD0iTSAzMTIsMTEzIEwgMjM0LDI4MyBMIDIwMCwxODggTCAxNTAsMTEzIiBzdHJva2U9IiM3QzNBRUQiIHN0cm9rZS13aWR0aD0iNTUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0gODgsMTEzIEwgMTY1LDI4MyBMIDIwMCwxODggTCAyNTAsMTEzIiBzdHJva2U9InVybCgjd0cpIiBzdHJva2Utd2lkdGg9IjU1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';

const LOGO_IMG = `<img src="data:image/svg+xml;base64,${LOGO_B64}" width="36" height="30" alt="WeWatch" style="display:block" />`;

// ── Shared colours ────────────────────────────────────────────────────────────
const C = {
  bg:         '#0A0A0F',
  card:       '#12111C',
  border:     '#1E1D2E',
  accent:     '#7C3AED',
  accentLt:   '#A78BFA',
  text:       '#FFFFFF',
  textMuted:  '#9996B8',
  textGhost:  '#4E4D6A',
  success:    '#22C55E',
  error:      '#EF4444',
  warning:    '#F59E0B',
};

// ── Base layout wrapper ───────────────────────────────────────────────────────
function base(accentColor: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="dark"/>
<title>WeWatch</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr>
          <td style="background:${C.card};border:1px solid ${C.border};border-bottom:none;border-radius:16px 16px 0 0;padding:28px 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <!-- W mark -->
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="background:#1A1130;border-radius:10px;padding:8px 10px;border:1px solid rgba(124,58,237,0.25);">
                      ${LOGO_IMG}
                    </td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.55);letter-spacing:-0.3px;">we</span><span style="font-size:18px;font-weight:800;color:#FFFFFF;letter-spacing:-0.3px;">Watch</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Accent line -->
        <tr>
          <td style="background:linear-gradient(90deg,transparent,${accentColor},transparent);height:1px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:${C.card};border:1px solid ${C.border};border-top:none;border-bottom:none;padding:32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0D0C17;border:1px solid ${C.border};border-top:1px solid ${C.border};border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:${C.textGhost};">
              © 2025 WeWatch · <a href="https://wewatch.uz" style="color:${C.textGhost};text-decoration:none;">wewatch.uz</a>
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:${C.textGhost};">Это автоматическое письмо — не отвечайте на него.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Template: Verification code ───────────────────────────────────────────────
export function verificationEmail(code: string): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">Подтвердите email</h2>
    <p style="margin:0 0 28px;font-size:14px;color:${C.textMuted};line-height:1.6;">
      Введите этот код в приложение WeWatch для завершения регистрации.
    </p>

    <!-- Code block -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#0D0C17;border:2px solid ${C.accent};border-radius:14px;padding:28px 24px;">
          <span style="font-size:48px;font-weight:900;letter-spacing:14px;color:${C.text};font-family:'JetBrains Mono',monospace;">${code}</span>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#1A1130;border-radius:10px;padding:14px 16px;border-left:3px solid ${C.accent};">
          <p style="margin:0;font-size:13px;color:${C.textMuted};">
            ⏱ Код действителен <strong style="color:${C.text};">10 минут</strong>.
            Никому не сообщайте его — команда WeWatch никогда не спрашивает коды.
          </p>
        </td>
      </tr>
    </table>
  `;
  return base(C.accent, content);
}

// ── Template: Password reset ──────────────────────────────────────────────────
export function passwordResetEmail(resetUrl: string): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">Сброс пароля</h2>
    <p style="margin:0 0 28px;font-size:14px;color:${C.textMuted};line-height:1.6;">
      Мы получили запрос на сброс пароля для вашего аккаунта WeWatch.
      Нажмите кнопку ниже, чтобы создать новый пароль.
    </p>

    <!-- CTA button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}"
             style="display:inline-block;background:linear-gradient(135deg,${C.accentLt},${C.accent});color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.2px;">
            Создать новый пароль →
          </a>
        </td>
      </tr>
    </table>

    <!-- URL fallback -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#0D0C17;border-radius:10px;padding:14px 16px;border:1px solid ${C.border};">
          <p style="margin:0 0 4px;font-size:11px;color:${C.textGhost};">Если кнопка не работает, скопируйте ссылку:</p>
          <p style="margin:0;font-size:12px;color:${C.accentLt};word-break:break-all;">${resetUrl}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#1A0A0A;border-radius:10px;padding:14px 16px;border-left:3px solid ${C.error};">
          <p style="margin:0;font-size:13px;color:${C.textMuted};">
            ⏱ Ссылка действительна <strong style="color:${C.text};">10 минут</strong>.
            Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
          </p>
        </td>
      </tr>
    </table>
  `;
  return base(C.accentLt, content);
}

// ── Template: Admin login security alert (self) ───────────────────────────────
export function adminLoginSelfEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">Вход в Admin Panel</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${C.textMuted};">
      Зафиксирован вход в панель управления WeWatch под вашим аккаунтом.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0C17;border:1px solid ${C.border};border-radius:12px;margin-bottom:20px;">
      ${row('Аккаунт', opts.adminEmail, C.accentLt)}
      ${row('Роль', opts.role)}
      ${row('IP-адрес', opts.ip ?? '—')}
      ${row('Устройство', opts.userAgent ?? '—', C.textMuted, true)}
      ${row('Время (UZT)', opts.time)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#1A0A0A;border-radius:10px;padding:14px 16px;border-left:3px solid ${C.error};">
          <p style="margin:0;font-size:13px;color:${C.textMuted};">
            Это не вы? Немедленно завершите все сессии в Admin Panel и смените пароль.
          </p>
        </td>
      </tr>
    </table>
  `;
  return base(C.warning, content);
}

// ── Template: Admin login alert (to superadmin) ───────────────────────────────
export function adminLoginAlertEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">⚠️ Вход в Admin Panel</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${C.textMuted};">
      Сотрудник выполнил вход в панель управления WeWatch.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0C17;border:1px solid ${C.border};border-radius:12px;margin-bottom:20px;">
      ${row('Аккаунт', opts.adminEmail, C.accentLt)}
      ${row('Роль', opts.role)}
      ${row('IP-адрес', opts.ip ?? '—')}
      ${row('Устройство', opts.userAgent ?? '—', C.textMuted, true)}
      ${row('Время (UZT)', opts.time)}
    </table>

    <p style="margin:0;font-size:12px;color:${C.textGhost};">Это автоматическое уведомление безопасности.</p>
  `;
  return base(C.warning, content);
}

// ── Template: Appeal decision ─────────────────────────────────────────────────
export function appealDecisionEmail(opts: {
  status: 'approved' | 'rejected'; note?: string;
}): string {
  const approved = opts.status === 'approved';
  const statusColor = approved ? C.success : C.error;
  const statusLabel = approved ? '✅ Апелляция одобрена' : '❌ Апелляция отклонена';
  const bodyText = approved
    ? 'Мы рассмотрели вашу апелляцию и приняли решение восстановить доступ к аккаунту. Вы можете войти снова.'
    : 'Мы рассмотрели вашу апелляцию, однако приняли решение оставить ограничение в силе.';

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${C.text};">Решение по апелляции</h2>

    <!-- Status badge -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:${statusColor}18;border:1px solid ${statusColor}40;border-radius:10px;padding:12px 20px;">
          <span style="font-size:15px;font-weight:700;color:${statusColor};">${statusLabel}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:${C.textMuted};line-height:1.7;">${bodyText}</p>

    ${opts.note ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#0D0C17;border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:0 10px 10px 0;padding:16px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.textGhost};text-transform:uppercase;letter-spacing:0.08em;">Комментарий модератора</p>
          <p style="margin:0;font-size:14px;color:${C.text};line-height:1.6;">${opts.note}</p>
        </td>
      </tr>
    </table>` : ''}

    <p style="margin:0;font-size:13px;color:${C.textGhost};">С уважением, команда WeWatch.</p>
  `;
  return base(statusColor, content);
}

// ── Helper: table row ─────────────────────────────────────────────────────────
function row(label: string, value: string, valueColor = '#FFFFFF', small = false): string {
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${C.border};font-size:12px;color:${C.textGhost};width:130px;vertical-align:top;">${label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${C.border};font-size:${small ? '12' : '13'}px;color:${valueColor};word-break:break-all;">${value}</td>
    </tr>`;
}
