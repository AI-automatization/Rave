// CineSync — Geo-blocked Site Extractor (T-S049)
//
// Sites like hdrezka.ag, filmix.net, kinogo.cc block non-Russian IPs.
// When GEO_PROXY_URL env var is configured, this extractor:
//   1. Fetches the geo-blocked page via the configured HTTP/SOCKS5 proxy
//   2. Tries Playerjs parsing (kinogo, filmix use it)
//   3. If iframe found → extracts iframe src (ashdi.vip, bazon.tv) →
//      returns iframeUrl so the caller can re-extract it without proxy
//      (ashdi.vip itself is not geo-blocked)
//
// GEO_PROXY_URL examples:
//   http://user:pass@1.2.3.4:3128          (HTTP proxy)
//   socks5://user:pass@1.2.3.4:1080        (SOCKS5 proxy)

import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { logger } from '@shared/utils/logger';
import { config } from '../../config';
import { VideoExtractResult, EpisodeInfo } from './types';

const FETCH_TIMEOUT_MS = 20_000;

const PLAYERJS_RE = /new\s+Playerjs\s*\(\s*\{[^}]*file\s*:\s*(['"`])([\s\S]*?)\1/;
const PLAYERJS_OBJ_RE = /new\s+Playerjs\s*\(\s*(\{[\s\S]*?\})\s*\)/;
const IFRAME_SRC_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const OG_TITLE_RE = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
const QUALITY_PRIORITY = ['2160p', '1080p', '720p', '480p', '360p'];

let _proxyAgent: ProxyAgent | null = null;

function getProxyAgent(): ProxyAgent | null {
  if (!config.geoProxyUrl) return null;
  if (!_proxyAgent) {
    _proxyAgent = new ProxyAgent(config.geoProxyUrl);
    logger.info('GeoExtractor: proxy agent initialized', { proxy: config.geoProxyUrl.replace(/:[^:@]+@/, ':***@') });
  }
  return _proxyAgent;
}

export const hasGeoProxy = (): boolean => !!config.geoProxyUrl;

async function proxyFetchHtml(url: string, referer: string): Promise<string | null> {
  const agent = getProxyAgent();
  if (!agent) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await undiciFetch(url, {
      dispatcher: agent,
      signal: controller.signal as AbortSignal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        Referer: referer,
      },
    } as Parameters<typeof undiciFetch>[1]);

    if (!resp.ok) {
      logger.warn('GeoExtractor: proxy fetch returned non-OK', { url, status: resp.status });
      return null;
    }
    return await resp.text();
  } catch (err) {
    logger.warn('GeoExtractor: proxy fetch failed', { url, error: (err as Error).message });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickBestQuality(str: string): string {
  const entries: Array<{ quality: string; url: string }> = [];
  const re = /\[([^\]]+)\](https?:\/\/[^\s,\[]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    entries.push({ quality: m[1], url: m[2] });
  }
  if (entries.length === 0) return str.startsWith('http') ? str : '';
  for (const q of QUALITY_PRIORITY) {
    const match = entries.find((e) => e.quality.toLowerCase().includes(q));
    if (match) return match.url;
  }
  return entries[0].url;
}

function parsePlayerjsFile(raw: string): { bestUrl: string | null; episodes: EpisodeInfo[] } {
  const trimmed = raw.trim();

  if (trimmed.startsWith('[{') || trimmed.startsWith('[  {')) {
    try {
      const parsed = JSON.parse(trimmed) as Array<{ title?: string; file?: string }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const episodes: EpisodeInfo[] = parsed
          .filter((e) => e.file)
          .map((e) => ({ label: e.title ?? 'Episode', url: pickBestQuality(e.file ?? ''), quality: undefined }));
        return { bestUrl: episodes[0]?.url ?? null, episodes };
      }
    } catch { /* fall through */ }
  }

  if (trimmed.includes('[') && trimmed.includes(']')) {
    return { bestUrl: pickBestQuality(trimmed), episodes: [] };
  }

  if (trimmed.startsWith('http')) {
    return { bestUrl: trimmed, episodes: [] };
  }

  return { bestUrl: null, episodes: [] };
}

function extractPlayerjsFile(html: string): string | null {
  const simple = PLAYERJS_RE.exec(html);
  if (simple) return simple[2];

  const objMatch = PLAYERJS_OBJ_RE.exec(html);
  if (objMatch) {
    const normalized = objMatch[1]
      .replace(/(['"])?([a-zA-Z_]+)(['"])?\s*:/g, '"$2":')
      .replace(/'/g, '"');
    try {
      const obj = JSON.parse(normalized) as { file?: string };
      if (obj.file) return obj.file;
    } catch { /* ignore */ }
  }

  return null;
}

function extractIframeUrls(html: string, baseHref: string): string[] {
  IFRAME_SRC_RE.lastIndex = 0;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = IFRAME_SRC_RE.exec(html)) !== null) {
    const src = m[1].trim();
    try {
      results.push(new URL(src, baseHref).href);
    } catch { /* skip invalid */ }
  }
  return results;
}

export interface GeoExtractResult {
  /** Full VideoExtractResult if Playerjs was found on the page */
  video?: VideoExtractResult;
  /** Iframe URL to re-extract (e.g. ashdi.vip) — no proxy needed for it */
  iframeUrl?: string;
}

export async function geoExtractor(rawUrl: string): Promise<GeoExtractResult | null> {
  logger.info('GeoExtractor: trying proxy fetch', { url: rawUrl });

  const html = await proxyFetchHtml(rawUrl, rawUrl);
  if (!html) return null;

  const title =
    OG_TITLE_RE.exec(html)?.[1]?.trim().replace(/\s*[-–|].*$/, '').trim() ??
    TITLE_RE.exec(html)?.[1]?.trim() ??
    new URL(rawUrl).hostname;

  const poster = OG_IMAGE_RE.exec(html)?.[1] ?? '';

  // 1. Try Playerjs on the page itself
  const fileValue = extractPlayerjsFile(html);
  if (fileValue) {
    const { bestUrl, episodes } = parsePlayerjsFile(fileValue);
    if (bestUrl) {
      const type = /\.m3u8|\/hls\//i.test(bestUrl) ? 'hls' : 'mp4';
      logger.info('GeoExtractor: Playerjs found', { url: rawUrl, bestUrl: bestUrl.slice(0, 80) });
      return {
        video: {
          title,
          videoUrl: bestUrl,
          poster,
          platform: 'playerjs',
          type,
          sourceType: 'type1',
          extractionMethod: 'playerjs',
          cacheable: true,
          episodes: episodes.length > 0 ? episodes : undefined,
        },
      };
    }
  }

  // 2. Look for iframe → return iframe URL for normal re-extraction (no proxy needed for embeds)
  const iframes = extractIframeUrls(html, rawUrl);
  for (const iframeSrc of iframes) {
    // Skip same-domain iframes and non-http
    if (!iframeSrc.startsWith('http')) continue;
    try {
      const iframeHostname = new URL(iframeSrc).hostname;
      if (iframeHostname === new URL(rawUrl).hostname) continue;
    } catch { continue; }

    logger.info('GeoExtractor: found iframe, returning for re-extraction', { iframe: iframeSrc.slice(0, 80) });
    return { iframeUrl: iframeSrc };
  }

  logger.warn('GeoExtractor: no video or iframe found', { url: rawUrl });
  return null;
}
