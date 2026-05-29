/**
 * notify-android-waitlist.ts
 *
 * Одноразовый скрипт — запускается при выходе Android версии.
 * Отправляет письмо всем подписчикам Android waitlist.
 *
 * Запуск:
 *   railway run --service notification npx ts-node scripts/notify-android-waitlist.ts
 *
 * Или локально (с .env):
 *   npx ts-node scripts/notify-android-waitlist.ts
 *
 * Dry-run (без отправки, только покажет кол-во):
 *   DRY_RUN=true npx ts-node scripts/notify-android-waitlist.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// ── Config ────────────────────────────────────────────────────────────────────
const MONGO_URI   = process.env.MONGO_URI!;
const SMTP_HOST   = process.env.SMTP_HOST ?? 'smtp.sendgrid.net';
const SMTP_PORT   = parseInt(process.env.SMTP_PORT ?? '587', 10);
const SMTP_USER   = process.env.SMTP_USER ?? '';
const SMTP_PASS   = process.env.SMTP_PASS ?? '';
const EMAIL_FROM  = process.env.EMAIL_FROM ?? 'noreply@wewatch.app';
const DRY_RUN     = process.env.DRY_RUN === 'true';
const BATCH_DELAY = 200; // ms между письмами — не спамим SendGrid

const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.wewatch.app';

// ── Waitlist model (inline — не импортируем из сервиса) ───────────────────────
const WaitlistSchema = new mongoose.Schema(
  { email: String, platform: String, locale: String, notifiedAt: Date },
  { collection: 'waitlists' },
);
const Waitlist = mongoose.model('Waitlist', WaitlistSchema);

// ── Email template ─────────────────────────────────────────────────────────────
function androidLaunchEmail(locale: string = 'ru'): { subject: string; html: string; text: string } {
  const isRu = locale !== 'en' && locale !== 'uz';
  const isUz = locale === 'uz';

  if (isUz) {
    return {
      subject: 'WeWatch Android chiqdi! 🎉 Yuklab oling',
      text: 'WeWatch Android versiyasi chiqdi! Google Play orqali yuklab oling: ' + ANDROID_STORE_URL,
      html: template(
        'Kutdingiz — Android chiqdi! 🎉',
        'Android versiyasi uchun ro\'yxatga yozilgan edingiz. U tayyor!',
        'Endi do\'stlaringiz bilan birga YouTube, VK va Rutubeni ko\'rishingiz mumkin — istalgan qurilmadan.',
        'Google Play\'dan yuklab oling →',
        ANDROID_STORE_URL,
        'WeWatch jamoasi 🎬',
      ),
    };
  }

  if (!isRu) {
    return {
      subject: 'WeWatch for Android is here! 🎉 Download now',
      text: 'WeWatch Android is now available! Download on Google Play: ' + ANDROID_STORE_URL,
      html: template(
        'You waited — Android is here! 🎉',
        'You signed up for the WeWatch Android waitlist. It\'s ready.',
        'Watch YouTube, VK and Rutube together with friends — on any device, for free.',
        'Download on Google Play →',
        ANDROID_STORE_URL,
        'The WeWatch Team 🎬',
      ),
    };
  }

  return {
    subject: 'WeWatch для Android вышел! 🎉 Скачивай',
    text: 'WeWatch для Android вышел! Скачай в Google Play: ' + ANDROID_STORE_URL,
    html: template(
      'Ждал — дождался. Android вышел! 🎉',
      'Ты подписался на список ожидания WeWatch для Android. Он готов.',
      'Теперь можно смотреть YouTube, VK и Rutube вместе с друзьями — с любого устройства, бесплатно.',
      'Скачать в Google Play →',
      ANDROID_STORE_URL,
      'Команда WeWatch 🎬',
    ),
  };
}

function template(
  headline: string,
  sub: string,
  desc: string,
  btnText: string,
  btnUrl: string,
  footer: string,
): string {
  const C = {
    bg: '#09090F', card: '#0F0E1A', border: '#1E1C30',
    accent: '#7C3AED', accentLt: '#A78BFA',
    text: '#F4F3FF', muted: '#7C7A9C', ghost: '#3C3A58',
    success: '#22C55E',
  };
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:44px 16px;">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
  <tr><td style="padding-bottom:24px;">
    <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#fff;">we<span style="color:${C.accent};">Watch</span></span>
  </td></tr>
  <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:18px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="height:3px;"></td>
        <td width="34%" style="height:3px;background:${C.success};"></td>
        <td width="33%" style="height:3px;"></td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:40px 44px 44px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${C.accentLt};text-transform:uppercase;letter-spacing:.12em;">Android · Google Play</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${C.text};line-height:1.2;">${headline}</h1>
      <p style="margin:0 0 12px;font-size:15px;color:${C.muted};line-height:1.7;">${sub}</p>
      <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;">${desc}</p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr><td style="background:${C.success};border-radius:12px;">
          <a href="${btnUrl}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">${btnText}</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:${C.ghost};">${footer}</p>
    </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="height:1px;background:${C.border};"></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 44px;">
        <p style="margin:0;font-size:12px;color:${C.ghost};">
          © 2025 <a href="https://wewatch.uz" style="color:${C.ghost};text-decoration:none;">WeWatch</a> · noreply@wewatch.app
        </p>
        <p style="margin:6px 0 0;font-size:11px;color:#2A2840;">Это письмо получено потому что вы подписались на Android waitlist.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!MONGO_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  const total = await Waitlist.countDocuments({ platform: 'android' });
  console.log(`📋 Found ${total} Android waitlist subscribers`);

  if (total === 0) { console.log('Nothing to send.'); process.exit(0); }
  if (DRY_RUN)     { console.log('DRY_RUN=true — no emails sent.'); process.exit(0); }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subscribers = await Waitlist.find({ platform: 'android', notifiedAt: { $exists: false } })
    .select('email locale')
    .lean();

  console.log(`📨 Sending to ${subscribers.length} unnotified subscribers...`);

  let sent = 0; let failed = 0;

  for (const sub of subscribers) {
    const email    = sub.email as string;
    const locale   = (sub.locale as string) ?? 'ru';
    const { subject, html, text } = androidLaunchEmail(locale);

    try {
      await transporter.sendMail({ from: `"WeWatch" <${EMAIL_FROM}>`, to: email, subject, html, text });
      await Waitlist.updateOne({ _id: sub._id }, { $set: { notifiedAt: new Date() } });
      sent++;
      process.stdout.write(`\r✅ Sent: ${sent}/${subscribers.length}`);
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    } catch (err) {
      failed++;
      console.error(`\n❌ Failed: ${email} — ${(err as Error).message}`);
    }
  }

  console.log(`\n\n🎉 Done! Sent: ${sent} | Failed: ${failed}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
