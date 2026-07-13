import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { Campaign } from '../models/campaign.model';
import { CampaignSubscriber } from '../models/campaignSubscriber.model';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';
import { LOGO_CID, LOGO_ATTACHMENT } from '../templates/email.templates';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Matches the minimalist style of ../templates/email.templates.ts — white background,
// no colored call-out boxes, the logo is the only branded color on the page.
function campaignEmail(_subject: string, body: string): string {
  const C = { bg: '#FFFFFF', border: '#E7E7EC', line: '#F1F1F5', text: '#18181B', muted: '#6B7280', faint: '#9CA3AF' };
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:44px 16px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td align="center" style="padding-bottom:32px;">
    <img src="cid:${LOGO_CID}" width="164" height="41" alt="weWatch" style="display:block;border:0;max-width:164px;height:auto;"/>
  </td></tr>
  <tr><td style="background-color:${C.bg};border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px 44px 44px;font-size:15px;color:${C.muted};line-height:1.7;">${body}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="height:1px;background-color:${C.line};"></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 44px;">
        <p style="margin:0;font-size:12px;color:${C.faint};">© 2025 <a href="https://wewatch.uz" style="color:${C.faint};text-decoration:none;">WeWatch</a> · noreply@wewatch.app</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export class CampaignController {
  // ── Public ─────────────────────────────────────────────────────────────────

  async listActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await Campaign.find({ status: 'active' })
        .select('name slug description subscriberCount status')
        .sort({ createdAt: -1 })
        .lean();
      res.json({ campaigns });
    } catch (err) { next(err); }
  }

  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const { email, locale = 'ru' } = req.body as { email: string; locale?: string };

      if (!email?.includes('@')) { res.status(400).json({ success: false, message: 'Invalid email' }); return; }

      const campaign = await Campaign.findOne({ slug, status: 'active' });
      if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found' }); return; }

      const existing = await CampaignSubscriber.findOne({ campaignSlug: slug, email: email.toLowerCase() });
      if (existing) { res.json({ success: true, message: 'Already subscribed' }); return; }

      await CampaignSubscriber.create({ campaignId: campaign._id, campaignSlug: slug, email: email.toLowerCase(), locale, ip: req.ip });
      await Campaign.updateOne({ _id: campaign._id }, { $inc: { subscriberCount: 1 } });

      logger.info('Campaign subscribe', { slug, locale });
      res.status(201).json({ success: true, message: 'Subscribed' });
    } catch (err) { next(err); }
  }

  // ── Internal (admin) ────────────────────────────────────────────────────────

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description = '', emailSubject = '', emailBody = '' } = req.body as Record<string, string>;
      if (!name) { res.status(400).json({ message: 'name required' }); return; }

      const slug = slugify(name);
      const exists = await Campaign.findOne({ slug });
      const finalSlug = exists ? `${slug}-${Date.now()}` : slug;

      const campaign = await Campaign.create({ name, slug: finalSlug, description, emailSubject, emailBody });
      res.status(201).json({ campaign });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const { name, description, emailSubject, emailBody } = req.body as Record<string, string>;
      const campaign = await Campaign.findOneAndUpdate(
        { slug },
        { $set: { name, description, emailSubject, emailBody } },
        { new: true },
      );
      if (!campaign) { res.status(404).json({ message: 'Not found' }); return; }
      res.json({ campaign });
    } catch (err) { next(err); }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const campaign = await Campaign.findOneAndUpdate({ slug, status: 'draft' }, { $set: { status: 'active' } }, { new: true });
      if (!campaign) { res.status(404).json({ message: 'Not found or already active' }); return; }
      res.json({ campaign });
    } catch (err) { next(err); }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const campaign = await Campaign.findOneAndUpdate({ slug, status: 'active' }, { $set: { status: 'draft' } }, { new: true });
      if (!campaign) { res.status(404).json({ message: 'Not found or not active' }); return; }
      res.json({ campaign });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      await Campaign.deleteOne({ slug });
      await CampaignSubscriber.deleteMany({ campaignSlug: slug });
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const campaign = await Campaign.findOne({ slug }).lean();
      if (!campaign) { res.status(404).json({ message: 'Not found' }); return; }
      const notified = await CampaignSubscriber.countDocuments({ campaignSlug: slug, notifiedAt: { $exists: true } });
      res.json({ campaign, stats: { total: campaign.subscriberCount, notified } });
    } catch (err) { next(err); }
  }

  async listAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
      res.json({ campaigns });
    } catch (err) { next(err); }
  }

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const campaign = await Campaign.findOne({ slug });
      if (!campaign) { res.status(404).json({ message: 'Campaign not found' }); return; }
      if (campaign.status === 'sent') { res.status(400).json({ message: 'Already sent' }); return; }
      if (!campaign.emailSubject || !campaign.emailBody) {
        res.status(400).json({ message: 'emailSubject and emailBody are required before sending' }); return;
      }

      const subscribers = await CampaignSubscriber.find({ campaignSlug: slug, notifiedAt: { $exists: false } }).lean();
      if (subscribers.length === 0) { res.json({ sent: 0, message: 'No subscribers to notify' }); return; }

      // Respond immediately — send in background
      res.json({ message: 'Sending started', total: subscribers.length });

      const transporter = nodemailer.createTransport({
        host: config.email.host, port: config.email.port, secure: false,
        auth: { user: config.email.user, pass: config.email.pass },
      });

      let sent = 0;
      for (const sub of subscribers) {
        try {
          await transporter.sendMail({
            from: `"WeWatch" <${config.email.from}>`,
            to: sub.email,
            subject: campaign.emailSubject,
            html: campaignEmail(campaign.emailSubject, campaign.emailBody),
            attachments: [LOGO_ATTACHMENT],
          });
          await CampaignSubscriber.updateOne({ _id: sub._id }, { $set: { notifiedAt: new Date() } });
          sent++;
          await new Promise(r => setTimeout(r, 150));
        } catch (err) {
          logger.warn('Campaign email failed', { error: (err as Error).message, email: '[REDACTED]' });
        }
      }

      await Campaign.updateOne({ slug }, { $set: { status: 'sent', sentAt: new Date() } });
      logger.info('Campaign sent', { slug, sent, total: subscribers.length });
    } catch (err) { next(err); }
  }
}
