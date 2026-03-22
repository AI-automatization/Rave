import nodemailer from 'nodemailer';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const BASE_URL = config.clientUrl;

export const emailService = {
  async sendVerificationEmail(to: string, code: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"CineSync" <${config.email.from}>`,
        to,
        subject: 'Tasdiqlash kodi — CineSync',
        html: `
          <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #fff; padding: 40px; border-radius: 12px;">
            <h1 style="color: #E50914; margin-bottom: 8px;">CineSync</h1>
            <p style="font-size: 18px; margin-bottom: 24px;">Email manzilingizni tasdiqlang</p>
            <p style="color: #ccc;">Ro'yxatdan o'tganingiz uchun rahmat! Quyidagi 6 raqamli kodni ilovaga kiriting:</p>
            <div style="background: #16161F; border: 2px solid #E50914; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #fff;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">Kod 10 daqiqa davomida amal qiladi.</p>
            <p style="color: #888; font-size: 13px;">Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>
          </div>
        `,
      });
      logger.info('Verification email sent', { to: '[REDACTED]' });
    } catch (error) {
      logger.error('Failed to send verification email', { error: (error as Error).message });
      // Email xatosi foydalanuvchini bloklashi kerak emas
    }
  },

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"CineSync" <${config.email.from}>`,
        to,
        subject: 'Parolni tiklash — CineSync',
        html: `
          <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #fff; padding: 40px; border-radius: 12px;">
            <h1 style="color: #E50914; margin-bottom: 8px;">CineSync</h1>
            <p style="font-size: 18px; margin-bottom: 24px;">Parolni tiklash</p>
            <p style="color: #ccc;">Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #E50914; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0;">
              Parolni tiklash
            </a>
            <p style="color: #888; font-size: 13px;">Havola 10 daqiqa davomida amal qiladi.</p>
            <p style="color: #888; font-size: 13px;">Agar siz so'rov yubormaganingizni hisoblasangiz, bu xatni e'tiborsiz qoldiring.</p>
          </div>
        `,
      });
      logger.info('Password reset email sent', { to: '[REDACTED]' });
    } catch (error) {
      logger.error('Failed to send password reset email', { error: (error as Error).message });
    }
  },

  async sendAdminLoginAlert(opts: {
    adminEmail: string;
    ip: string | null;
    userAgent: string | null;
    role: string;
    timestamp: Date;
  }): Promise<void> {
    const device = opts.userAgent ?? 'Unknown device';
    const time = opts.timestamp.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });

    const alertHtml = `
      <div style="font-family: monospace; max-width: 560px; margin: 0 auto; background: #09090b; color: #e4e4e7; padding: 32px; border-radius: 8px; border: 1px solid #27272a;">
        <p style="color: #71717a; font-size: 11px; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px;">CineSync Admin Alert</p>
        <h2 style="color: #fff; margin: 0 0 24px; font-size: 18px; font-weight: 600;">Admin panel login detected</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #71717a; padding: 6px 0; width: 120px; font-size: 13px;">Account</td>
            <td style="color: #3b82f6; font-size: 13px;">${opts.adminEmail}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">Role</td>
            <td style="color: #fff; font-size: 13px;">${opts.role}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">IP Address</td>
            <td style="color: #fff; font-size: 13px;">${opts.ip ?? '—'}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">Device / UA</td>
            <td style="color: #a1a1aa; font-size: 12px; word-break: break-all;">${device}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">Time (UZT)</td>
            <td style="color: #fff; font-size: 13px;">${time}</td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #52525b; font-size: 12px;">
          If this was not you, immediately revoke all sessions via admin panel.
        </p>
      </div>
    `;

    const selfHtml = `
      <div style="font-family: monospace; max-width: 560px; margin: 0 auto; background: #09090b; color: #e4e4e7; padding: 32px; border-radius: 8px; border: 1px solid #27272a;">
        <p style="color: #71717a; font-size: 11px; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px;">CineSync Security</p>
        <h2 style="color: #fff; margin: 0 0 24px; font-size: 18px; font-weight: 600;">Akkauntingizga kirish amalga oshirildi</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #71717a; padding: 6px 0; width: 120px; font-size: 13px;">Email</td>
            <td style="color: #3b82f6; font-size: 13px;">${opts.adminEmail}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">Lavozim</td>
            <td style="color: #fff; font-size: 13px;">${opts.role}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">IP manzil</td>
            <td style="color: #fff; font-size: 13px;">${opts.ip ?? '—'}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">Qurilma</td>
            <td style="color: #a1a1aa; font-size: 12px; word-break: break-all;">${device}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0; font-size: 13px;">Vaqt (UZT)</td>
            <td style="color: #fff; font-size: 13px;">${time}</td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #ef4444; font-size: 13px; font-weight: 600;">
          Agar bu siz bo'lmasangiz — darhol admin-panel orqali barcha sessiyalarni o'chiring!
        </p>
      </div>
    `;

    const superadminEmail = config.superadminEmail;
    const isSuperadminLogin = opts.adminEmail === superadminEmail;

    const sends: Promise<void>[] = [];

    // 1. Always send self-notification to the logged-in staff member
    sends.push(
      transporter.sendMail({
        from: `"CineSync Security" <${config.email.from}>`,
        to: opts.adminEmail,
        subject: `🔐 Akkauntga kirish — ${time}`,
        html: selfHtml,
      }).then(() => undefined),
    );

    // 2. Alert superadmin — unless it IS the superadmin logging in (no need to alert themselves twice)
    if (!isSuperadminLogin) {
      sends.push(
        transporter.sendMail({
          from: `"CineSync Security" <${config.email.from}>`,
          to: superadminEmail,
          subject: `⚠️ Admin login — ${opts.adminEmail} (${opts.role})`,
          html: alertHtml,
        }).then(() => undefined),
      );
    }

    try {
      await Promise.all(sends);
      logger.info('Admin login alert emails sent', { role: opts.role, self: opts.adminEmail, superadmin: !isSuperadminLogin });
    } catch (error) {
      logger.warn('Admin login alert email failed', { error: (error as Error).message });
    }
  },

  async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      logger.info('Email service connected');
      return true;
    } catch (error) {
      logger.warn('Email service not available', { error: (error as Error).message });
      return false;
    }
  },
};
