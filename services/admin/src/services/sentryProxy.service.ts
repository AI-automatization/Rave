// WeWatch Admin — read-only proxy to the Sentry REST API for the admin-ui issues page.
// Sentry's own auth token never reaches the browser — this service holds it, admin-ui only
// ever talks to our own /api/v1/sentry/* routes (verifyToken + requireRole, same as errors.*).

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string | null;
  level: string;
  status: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  platform: string;
}

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG_SLUG = process.env.SENTRY_ORG_SLUG;
const SENTRY_PROJECT_SLUG = process.env.SENTRY_PROJECT_SLUG;

export class SentryProxyService {
  isConfigured(): boolean {
    return !!(SENTRY_AUTH_TOKEN && SENTRY_ORG_SLUG && SENTRY_PROJECT_SLUG);
  }

  async listIssues(query: string = 'is:unresolved'): Promise<SentryIssue[]> {
    if (!this.isConfigured()) {
      throw new Error('Sentry proxy not configured (SENTRY_AUTH_TOKEN / SENTRY_ORG_SLUG / SENTRY_PROJECT_SLUG)');
    }

    const url = new URL(
      `https://sentry.io/api/0/projects/${SENTRY_ORG_SLUG}/${SENTRY_PROJECT_SLUG}/issues/`,
    );
    url.searchParams.set('query', query);
    url.searchParams.set('sort', 'date');
    url.searchParams.set('limit', '50');

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`Sentry API ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as Array<Record<string, unknown>>;
    return data.map((raw) => ({
      id: String(raw.id),
      title: String(raw.title ?? ''),
      culprit: (raw.culprit as string) ?? null,
      level: String(raw.level ?? ''),
      status: String(raw.status ?? ''),
      count: String(raw.count ?? '0'),
      userCount: Number(raw.userCount ?? 0),
      firstSeen: String(raw.firstSeen ?? ''),
      lastSeen: String(raw.lastSeen ?? ''),
      permalink: String(raw.permalink ?? ''),
      platform: String((raw.platform as string) ?? raw.type ?? ''),
    }));
  }
}
