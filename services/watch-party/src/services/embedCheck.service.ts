// WeWatch — embeddability probe: can the client open `url` in an <iframe> on our app origin?
// A site refuses framing with X-Frame-Options or a CSP frame-ancestors directive; the browser
// then shows a blank/error box with no way for the page to detect it, so the client asks here first
// (GET /watch-party/embed-check) and only iframes links that report `embeddable: true`.
//
// Server-side fetch of a user-supplied URL = SSRF surface, so it reuses the exact guard
// vbMediaProxy.controller.ts runs per hop (validateProxyUrl + DNS-resolved resolveSafeUpstream),
// redirects are followed manually and every hop is re-checked.
import crypto from 'node:crypto';
import Redis from 'ioredis';
import { validateProxyUrl, resolveSafeUpstream } from '@shared/utils/ssrfGuard';
import { REDIS_KEYS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import { config } from '../config';
import { isOwnVbUrl, isPrivateUrl } from './extractionClient';
import { isDomainBlocked } from '../controllers/domain.admin.controller';

export type EmbedReason = 'ok' | 'xfo' | 'csp' | 'unreachable' | 'blocked' | 'private' | 'invalid';
export interface EmbedCheckResult { embeddable: boolean; finalUrl: string; reason: EmbedReason }

const MAX_REDIRECTS = 5;
const CHECK_TIMEOUT_MS = 6_000; // total budget across all hops — the client is waiting on this
const CACHE_TTL_SEC = 60 * 60;
// Same family of UA the VB proxy uses: some sites answer differently (or 403) for non-browser UAs,
// and the framing headers a real browser would see are what we need to read.
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Our app origins = CORS_ORIGINS (config/index.ts, the whitelist the web client is served from) —
// no separate env var. Normalised to lowercase `scheme://host[:port]`.
const APP_ORIGINS: string[] = config.corsOrigins
  .split(',')
  .map((o) => o.trim().toLowerCase().replace(/\/+$/, ''))
  .filter(Boolean);

/** One CSP frame-ancestors source expression vs one of our origins. */
function sourceAllows(source: string, origin: string): boolean {
  const src = source.toLowerCase();
  if (src === '*') return true;
  // 'none' / 'self' (self = the framed site itself, never us) and nonce/hash tokens never match.
  if (src.startsWith("'")) return false;
  let o: URL;
  try { o = new URL(origin); } catch { return false; }
  // Scheme-only source ("https:").
  if (/^[a-z][a-z0-9+.-]*:$/.test(src)) return o.protocol === src;
  // Origin or host source, optional scheme, optional leading "*." wildcard, optional port.
  const m = /^(?:([a-z][a-z0-9+.-]*):\/\/)?(\*\.)?([^/:*]+|\*)(?::(\d+|\*))?(?:\/.*)?$/.exec(src);
  if (!m) return false;
  const [, scheme, wild, host, port] = m;
  if (scheme && `${scheme}:` !== o.protocol) return false; // scheme-less source matches http and https
  if (wild ? !o.hostname.endsWith(`.${host}`) : o.hostname !== host) return false;
  if (port && port !== '*' && port !== (o.port || (o.protocol === 'https:' ? '443' : '80'))) return false;
  return true;
}

/** True if every CSP policy in the header that carries frame-ancestors lets one of our origins in.
 *  Returns null when no policy has frame-ancestors (CSP says nothing about framing). Several policies
 *  are comma-joined by fetch(); the browser enforces ALL of them, so any failing one blocks. */
export function cspFrameAncestorsAllows(csp: string | null): boolean | null {
  if (!csp) return null;
  let seen = false;
  for (const policy of csp.split(',')) {
    const directive = policy.split(';').map((d) => d.trim()).find((d) => /^frame-ancestors(\s|$)/i.test(d));
    if (!directive) continue;
    seen = true;
    const sources = directive.split(/\s+/).slice(1);
    if (sources.length === 0) return false;
    if (!APP_ORIGINS.some((origin) => sources.some((s) => sourceAllows(s, origin)))) return false;
  }
  return seen ? true : null;
}

/** X-Frame-Options blocks everything except an absent header: DENY, SAMEORIGIN and the obsolete
 *  ALLOW-FROM (ignored by modern browsers → effectively deny) all mean "not for us". */
function xfoBlocks(xfo: string | null): boolean {
  if (!xfo) return false;
  return xfo.split(',').some((v) => /^(deny|sameorigin|allow-from)/i.test(v.trim()));
}

async function guardHop(url: string): Promise<EmbedReason | null> {
  const ssrfError = validateProxyUrl(url); // also rejects non-http(s)
  if (ssrfError) return /^(Hostname blocked|Private)/.test(ssrfError) ? 'private' : 'invalid';
  if (isPrivateUrl(url)) return 'private';
  if (isOwnVbUrl(url)) return 'invalid';
  const resolved = await resolveSafeUpstream(url);
  if ('error' in resolved) return resolved.error.startsWith('DNS resolution') ? 'unreachable' : 'private';
  return null;
}

async function probe(redis: Redis, rawUrl: string): Promise<EmbedCheckResult> {
  const fail = (reason: EmbedReason, finalUrl = rawUrl): EmbedCheckResult => ({ embeddable: false, finalUrl, reason });
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return fail('invalid');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fail('invalid');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  let current = parsed.href;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const rejected = await guardHop(current);
      if (rejected) return fail(rejected, current);
      // A redirect can land on a domain the admin blocked even when the typed one is fine.
      if (await isDomainBlocked(redis, current)) return fail('blocked', current);

      let res: globalThis.Response;
      try {
        res = await fetch(current, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' },
        });
      } catch {
        return fail('unreachable', current);
      }
      // Headers are all we need — drop the body unread so the socket is released.
      void res.body?.cancel().catch(() => { /* already closed */ });

      if (res.status >= 300 && res.status <= 399) {
        const loc = res.headers.get('location');
        if (!loc) return fail('unreachable', current);
        try { current = new URL(loc, current).href; } catch { return fail('invalid', current); }
        continue;
      }
      if (res.status >= 500) return fail('unreachable', current);

      // CSP frame-ancestors, when present, supersedes X-Frame-Options in every current browser.
      const csp = cspFrameAncestorsAllows(res.headers.get('content-security-policy'));
      if (csp === false) return fail('csp', current);
      if (csp === null && xfoBlocks(res.headers.get('x-frame-options'))) return fail('xfo', current);
      return { embeddable: true, finalUrl: current, reason: 'ok' };
    }
    return fail('unreachable', current); // redirect loop / too many hops
  } finally {
    clearTimeout(timer);
  }
}

export async function checkEmbeddable(redis: Redis, rawUrl: string): Promise<EmbedCheckResult> {
  const key = REDIS_KEYS.embedCheck(crypto.createHash('sha256').update(rawUrl).digest('hex').slice(0, 32));
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as EmbedCheckResult;
  } catch (e) {
    logger.warn('embed-check: cache read failed', { error: (e as Error).message });
  }
  const result = await probe(redis, rawUrl);
  // 'invalid' costs nothing to recompute and 'unreachable' is often transient — cache only verdicts
  // that reflect the site's own headers (or our policy), so a blip doesn't pin a link as broken for an hour.
  if (result.reason !== 'invalid' && result.reason !== 'unreachable') {
    await redis.setex(key, CACHE_TTL_SEC, JSON.stringify(result)).catch((e) => {
      logger.warn('embed-check: cache write failed', { error: (e as Error).message });
    });
  }
  return result;
}
