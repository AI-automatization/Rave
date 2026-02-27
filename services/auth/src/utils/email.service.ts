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
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${BASE_URL}/auth/verify-email?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"CineSync" <${config.email.from}>`,
        to,
        subject: 'Email manzilingizni tasdiqlang — CineSync',
        html: `
          <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #fff; padding: 40px; border-radius: 12px;">
            <h1 style="color: #E50914; margin-bottom: 8px;">CineSync</h1>
            <p style="font-size: 18px; margin-bottom: 24px;">Email manzilingizni tasdiqlang</p>
            <p style="color: #ccc;">Ro'yxatdan o'tganingiz uchun rahmat! Hisobingizni faollashtirish uchun quyidagi tugmani bosing:</p>
            <a href="${verifyUrl}"
               style="display: inline-block; background: #E50914; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0;">
              Email ni tasdiqlash
            </a>
            <p style="color: #888; font-size: 13px;">Havola 10 daqiqa davomida amal qiladi.</p>
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
