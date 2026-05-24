// WeWatch — Branded Email Templates

const LOGO_URL = 'https://admin.wewatch.uz/logo-email.svg';

const C = {
  bg:       '#09090F',
  card:     '#111119',
  border:   '#1C1B2E',
  accent:   '#7C3AED',
  accentLt: '#A78BFA',
  text:     '#FFFFFF',
  muted:    '#7B7A9A',
  ghost:    '#3D3C58',
  success:  '#22C55E',
  error:    '#EF4444',
  warning:  '#F59E0B',
};

function wrap(content: string, accentLine = C.accent): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:48px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

  <!-- Logo row -->
  <tr>
    <td style="padding-bottom:32px;">
      <img src="${LOGO_URL}" width="120" height="40" alt="weWatch" style="display:block;border:0;"/>
    </td>
  </tr>

  <!-- Card -->
  <tr>
    <td style="background:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
      <!-- accent top line -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="height:2px;background:linear-gradient(90deg,transparent,${accentLine} 40%,transparent);"></td>
      </tr></table>

      <!-- content -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:36px 40px 40px;">
          ${content}
        </td></tr>
      </table>

      <!-- footer -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid ${C.border};padding:18px 40px;text-align:center;">
          <span style="font-size:12px;color:${C.ghost};">
            © 2025 <a href="https://wewatch.uz" style="color:${C.ghost};text-decoration:none;">WeWatch</a>
          </span>
        </td>
      </tr></table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ── Verification code ─────────────────────────────────────────────────────────
export function verificationEmail(code: string): string {
  return wrap(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">Подтверждение email</p>
    <h1 style="margin:0 0 28px;font-size:26px;font-weight:700;color:${C.text};">Ваш код</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#0D0C1A;border:1.5px solid ${C.accent};border-radius:12px;padding:30px 20px;">
          <span style="font-size:52px;font-weight:900;letter-spacing:16px;color:${C.text};font-family:'Courier New',monospace;">${code}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${C.muted};text-align:center;">Действителен&nbsp;<strong style="color:${C.text};">10 минут</strong></p>
  `);
}

// ── Password reset ────────────────────────────────────────────────────────────
export function passwordResetEmail(resetUrl: string): string {
  return wrap(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">Безопасность аккаунта</p>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:${C.text};">Сброс пароля</h1>
    <p style="margin:0 0 32px;font-size:14px;color:${C.muted};line-height:1.6;">Нажмите кнопку ниже чтобы задать новый пароль. Ссылка действительна&nbsp;<strong style="color:${C.text};">10 минут</strong>.</p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:${C.accent};border-radius:10px;">
          <a href="${resetUrl}" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
            Создать новый пароль
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:${C.ghost};">Не запрашивали сброс? Просто проигнорируйте это письмо.</p>
  `, C.accentLt);
}

// ── Admin login alert — to the staff member ───────────────────────────────────
export function adminLoginSelfEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  return wrap(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">Безопасность</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${C.text};">Вход в Admin Panel</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0C1A;border-radius:10px;margin-bottom:20px;">
      ${detailRow('Аккаунт', opts.adminEmail, C.accentLt)}
      ${detailRow('Роль', opts.role)}
      ${detailRow('IP', opts.ip ?? '—')}
      ${detailRow('Время', opts.time)}
      ${detailRow('Устройство', (opts.userAgent ?? '—').slice(0, 80), C.muted, true)}
    </table>

    <p style="margin:0;font-size:12px;color:${C.ghost};">Если это не вы — смените пароль и завершите все сессии.</p>
  `, C.warning);
}

// ── Admin login alert — to superadmin ────────────────────────────────────────
export function adminLoginAlertEmail(opts: {
  adminEmail: string; ip: string | null; userAgent: string | null; role: string; time: string;
}): string {
  return wrap(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${C.warning};text-transform:uppercase;letter-spacing:0.1em;">Уведомление</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${C.text};">Вход в панель</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0C1A;border-radius:10px;margin-bottom:20px;">
      ${detailRow('Аккаунт', opts.adminEmail, C.accentLt)}
      ${detailRow('Роль', opts.role)}
      ${detailRow('IP', opts.ip ?? '—')}
      ${detailRow('Время', opts.time)}
    </table>
  `, C.warning);
}

// ── Appeal decision ───────────────────────────────────────────────────────────
export function appealDecisionEmail(opts: {
  status: 'approved' | 'rejected'; note?: string;
}): string {
  const ok = opts.status === 'approved';
  const color = ok ? C.success : C.error;
  const label = ok ? 'Апелляция одобрена' : 'Апелляция отклонена';
  const body = ok
    ? 'Мы восстановили доступ к вашему аккаунту. Вы можете войти снова.'
    : 'К сожалению, мы оставили ограничение в силе.';

  return wrap(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">Решение по апелляции</p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:${color}18;border:1px solid ${color}40;border-radius:8px;padding:10px 18px;">
          <span style="font-size:15px;font-weight:700;color:${color};">${label}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 ${opts.note ? '24px' : '0'};font-size:14px;color:${C.muted};line-height:1.7;">${body}</p>

    ${opts.note ? `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0D0C1A;border-left:2px solid ${C.accent};padding:14px 18px;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px;font-size:11px;color:${C.ghost};text-transform:uppercase;letter-spacing:0.08em;">Комментарий</p>
          <p style="margin:0;font-size:13px;color:${C.text};line-height:1.5;">${opts.note}</p>
        </td>
      </tr>
    </table>` : ''}
  `, color);
}

function detailRow(label: string, value: string, valueColor = '#FFFFFF', small = false): string {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid ${C.border};font-size:12px;color:${C.ghost};width:100px;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid ${C.border};font-size:${small ? 11 : 13}px;color:${valueColor};word-break:break-all;">${value}</td>
  </tr>`;
}
