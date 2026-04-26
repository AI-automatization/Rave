import crypto from 'crypto';
import { MobileIssue, IMobileIssueDocument, IssueStatus } from '../models/mobileIssue.model';
import { MobileEvent } from '../models/mobileEvent.model';

interface SentryException {
  type?: string;
  value?: string;
  stacktrace?: {
    frames?: Array<{
      filename?: string;
      function?: string;
      lineno?: number;
      colno?: number;
    }>;
  };
}

interface SentryEvent {
  event_id?: string;
  timestamp?: string;
  level?: string;
  platform?: string;
  release?: string;
  environment?: string;
  user?: { id?: string; [k: string]: unknown };
  contexts?: {
    os?: { name?: string; version?: string; api_level?: number; brand?: string; manufacturer?: string; fingerprint?: string; model?: string; is_tablet?: boolean };
    device?: { name?: string; model?: string; brand?: string; manufacturer?: string; screen_width?: number; screen_height?: number; screen_density?: number; color_scheme?: string; is_tablet?: boolean };
    app?: { app_version?: string; build_number?: string; app_name?: string; execution_env?: string; is_expo_go?: boolean; app_state?: string; session_id?: string };
    runtime?: { expo_sdk?: string; js_engine?: string; rn_version?: string; hermes_version?: string };
    culture?: { timezone?: string; locale?: string };
  };
  exception?: { values?: SentryException[] };
  message?: string;
  breadcrumbs?: { values?: unknown[] };
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
}

function buildFingerprint(event: SentryEvent): string {
  const exc = event.exception?.values?.[0];
  const type = exc?.type ?? 'UnknownError';
  const frames = exc?.stacktrace?.frames ?? [];
  const topFrame = frames[frames.length - 1];
  const file = topFrame?.filename ?? '';
  const fn = topFrame?.function ?? '';
  const raw = `${type}::${file}::${fn}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function extractTitle(event: SentryEvent): string {
  return event.exception?.values?.[0]?.type ?? event.message ?? 'Unknown Error';
}

function extractMessage(event: SentryEvent): string {
  return event.exception?.values?.[0]?.value ?? event.message ?? '';
}

function extractPlatform(event: SentryEvent): 'ios' | 'android' | 'unknown' {
  const os = event.contexts?.os?.name?.toLowerCase() ?? '';
  if (os.includes('ios')) return 'ios';
  if (os.includes('android')) return 'android';
  return 'unknown';
}

function extractDevice(event: SentryEvent): string {
  const d = event.contexts?.device;
  if (!d) return '';
  const parts = [d.manufacturer ?? d.brand, d.model ?? d.name].filter(Boolean);
  return parts.join(' ') || 'unknown';
}

function extractOsVersion(event: SentryEvent): string {
  const os = event.contexts?.os;
  if (!os) return '';
  const apiLevel = os.api_level ? ` (API ${os.api_level})` : '';
  return `${os.name ?? ''} ${os.version ?? ''}${apiLevel}`.trim();
}

export class ErrorsService {
  async ingestEvent(event: SentryEvent): Promise<void> {
    const fingerprint = buildFingerprint(event);
    const title = extractTitle(event);
    const message = extractMessage(event);
    const platform = extractPlatform(event);
    const appVersion = event.release ?? event.contexts?.app?.app_version ?? '';
    const environment = event.environment ?? 'production';
    const userId = event.user?.id ?? null;
    const now = new Date();

    // Upsert issue — if same fingerprint exists, increment count
    let issue: IMobileIssueDocument | null = await MobileIssue.findOne({ fingerprint });

    if (!issue) {
      issue = await MobileIssue.create({
        fingerprint, title, message, platform, appVersion, environment,
        count: 1, affectedUsers: userId ? 1 : 0,
        firstSeen: now, lastSeen: now,
      });
    } else {
      const update: Record<string, unknown> = {
        $inc: { count: 1 },
        $set: { lastSeen: now, appVersion, message },
      };
      if (userId) update.$inc = { count: 1, affectedUsers: 1 };
      await MobileIssue.updateOne({ _id: issue._id }, update);
    }

    // Store individual event
    await MobileEvent.create({
      issueId: issue._id,
      eventId: event.event_id ?? '',
      userId: userId ? String(userId) : null,
      level: (['fatal','error','warning','info'].includes(event.level ?? '') ? event.level : 'error') as 'fatal' | 'error' | 'warning' | 'info',
      platform: event.platform ?? platform,
      appVersion,
      osVersion: extractOsVersion(event),
      device: extractDevice(event),
      stackTrace: event.exception ?? {},
      breadcrumbs: event.breadcrumbs?.values ?? [],
      context: {
        user: event.user,
        tags: event.tags,
        extra: event.extra,
        contexts: event.contexts,
      },
      timestamp: now,
    });
  }

  async listIssues(params: {
    page: number;
    limit: number;
    status?: IssueStatus;
    search?: string;
  }): Promise<{ data: Record<string, unknown>[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit, status, search } = params;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      MobileIssue.find(filter).sort({ lastSeen: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MobileIssue.countDocuments(filter),
    ]);

    const mapped = data.map((e) => ({ ...e, id: String(e._id) }));
    return { data: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats() {
    const [newCount, inProgressCount, resolvedCount, ignoredCount] = await Promise.all([
      MobileIssue.countDocuments({ status: 'new' }),
      MobileIssue.countDocuments({ status: 'in_progress' }),
      MobileIssue.countDocuments({ status: 'resolved' }),
      MobileIssue.countDocuments({ status: 'ignored' }),
    ]);
    return { new: newCount, in_progress: inProgressCount, resolved: resolvedCount, ignored: ignoredCount };
  }

  async updateStatus(id: string, status: IssueStatus) {
    return MobileIssue.findByIdAndUpdate(id, { status }, { new: true });
  }

  async getIssueEvents(issueId: string, page: number, limit: number): Promise<{ data: Record<string, unknown>[]; total: number; page: number; limit: number; totalPages: number }> {
    const [data, total] = await Promise.all([
      MobileEvent.find({ issueId }).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MobileEvent.countDocuments({ issueId }),
    ]);
    const mapped = data.map((e) => ({ ...e, id: String(e._id) }));
    return { data: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteIssue(id: string) {
    await Promise.all([
      MobileIssue.findByIdAndDelete(id),
      MobileEvent.deleteMany({ issueId: id }),
    ]);
  }
}

