import nodemailer from 'nodemailer';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';
import {
  verificationEmail,
  passwordResetEmail,
  adminLoginSelfEmail,
  adminLoginAlertEmail,
  appealDecisionEmail,
  welcomeEmail,
  LOGO_CID,
  LOGO_PNG_BASE64,
} from './emailTemplates';

// CID attachment — embedded inline so logo always shows without "Show images" click.
// PNG (not SVG) — SVG inline images render unreliably in Outlook/older mail clients.
const LOGO_ATTACHMENT = {
  filename: 'logo.png',
  content: Buffer.from(LOGO_PNG_BASE64, 'base64'),
  cid: LOGO_CID,
  contentType: 'image/png',
};

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
        from: `"WeWatch" <${config.email.from}>`,
        to,
        subject: `${code} — код подтверждения WeWatch`,
        html: verificationEmail(code),
        attachments: [LOGO_ATTACHMENT],
      });
      logger.info('Verification email sent', { to: '[REDACTED]' });
    } catch (error) {
      logger.error('Failed to send verification email', { error: (error as Error).message });
    }
  },

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"WeWatch" <${config.email.from}>`,
        to,
        subject: 'Сброс пароля — WeWatch',
        html: passwordResetEmail(resetUrl),
        attachments: [LOGO_ATTACHMENT],
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
    const time = opts.timestamp.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });

    const superadminEmail = config.superadminEmail;
    const isSuperadminLogin = opts.adminEmail === superadminEmail;
    const emailOpts = { ...opts, time };

    const sends: Promise<void>[] = [];

    sends.push(
      transporter.sendMail({
        from: `"WeWatch Security" <${config.email.from}>`,
        to: opts.adminEmail,
        subject: `🔐 Вход в Admin Panel — ${time}`,
        html: adminLoginSelfEmail(emailOpts),
        attachments: [LOGO_ATTACHMENT],
      }).then(() => undefined),
    );

    if (!isSuperadminLogin) {
      sends.push(
        transporter.sendMail({
          from: `"WeWatch Security" <${config.email.from}>`,
          to: superadminEmail,
          subject: `⚠️ Admin login — ${opts.adminEmail} (${opts.role})`,
          html: adminLoginAlertEmail(emailOpts),
          attachments: [LOGO_ATTACHMENT],
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

  async sendAppealDecisionEmail(opts: {
    to: string;
    status: 'approved' | 'rejected';
    note?: string;
  }): Promise<void> {
    const isApproved = opts.status === 'approved';
    const subject = isApproved
      ? 'Ваша апелляция одобрена — WeWatch'
      : 'Ваша апелляция отклонена — WeWatch';

    try {
      await transporter.sendMail({
        from: `"WeWatch" <${config.email.from}>`,
        to: opts.to,
        subject,
        html: appealDecisionEmail(opts),
        attachments: [LOGO_ATTACHMENT],
      });
      logger.info('Appeal decision email sent', { to: '[REDACTED]', status: opts.status });
    } catch (error) {
      logger.error('Failed to send appeal decision email', { error: (error as Error).message });
    }
  },

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    try {
      await transporter.sendMail({
        from:        `"WeWatch" <${config.email.from}>`,
        to,
        subject:     `Добро пожаловать в WeWatch, ${username}! 🎬`,
        html:        welcomeEmail(username),
        attachments: [LOGO_ATTACHMENT],
      });
      logger.info('Welcome email sent', { to: '[REDACTED]' });
    } catch (error) {
      logger.warn('Failed to send welcome email', { error: (error as Error).message });
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
