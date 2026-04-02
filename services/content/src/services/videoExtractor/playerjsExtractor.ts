// CineSync — Playerjs Extractor
//
// Playerjs is a popular CIS video player. Sites store all episode URLs
// inside an inline <script> as JSON: new Playerjs({file: [...]})
// No CDN protection — just parse the HTML and extract.
//
// File format examples:
//   Single:  "https://cdn.example.com/movie.mp4"
//   Multi-quality: "[720p]url720,[1080p]url1080"
//   Multi-episode: "[{title:S1E1,file:url1},{title:S1E2,file:url2}]"

import { logger } from '@shared/utils/logger';
import { VideoExtractResult, EpisodeInfo } from './types';

const FETCH_TIMEOUT_MS = 15_000;
const PLAYERJS_RE = /new\s+Playerjs\s*\(\s*\{[^}]*file\s*:\s*(['"`])([\s\S]*?)\1/;
const PLAYERJS_OBJ_RE = /new\s+Playerjs\s*\(\s*(\{[\s\S]*?\})\s*\)/;

/** Quality priority for single-file multi-quality strings */
const QUALITY_PRIORITY = ['2160p', '1080p', '720p', '480p', '360p', '240p'];

/**
 * Parse Playerjs `file` field.
 * Returns { bestUrl, episodes } where:
 *   - bestUrl is the highest quality single URL
 *   - episodes is populated if multi-episode content
 */
function parsePlayerjsFile(raw: string): {
  bestUrl: string | null;
  episodes: EpisodeInfo[];
} {
  const trimmed = raw.trim();

  // Multi-episode JSON array: [{title:"S1E1",file:"url"},{...}]
  if (trimmed.startsWith('[{') || trimmed.startsWith('[  {')) {
    try {
      const parsed = JSON.parse(trimmed) as Array<{ title?: string; file?: string }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const episodes: EpisodeInfo[] = parsed
          .filter((e) => e.file)
          .map((e) => ({
            label: e.title ?? 'Episode',
            url: pickBestQualityFromMulti(e.file ?? ''),
            quality: extractQualityLabel(e.file ?? ''),
          }));
        const bestUrl = episodes[0]?.url ?? null;
        return { bestUrl, episodes };
      }
    } catch {
      // not valid JSON — fall through to string parsing
    }
  }

  // Single multi-quality string: "[720p]url720,[1080p]url1080"
  if (trimmed.includes('[') && trimmed.includes(']')) {
    const bestUrl = pickBestQualityFromMulti(trimmed);
    return { bestUrl, episodes: [] };
  }

  // Plain URL
  if (trimmed.startsWith('http')) {
    return { bestUrl: trimmed, episodes: [] };
  }

  return { bestUrl: null, episodes: [] };
}

/**
 * From "[720p]url720,[1080p]url1080" pick highest quality URL.
 * Format: [qualityLabel]url (comma or space separated)
 */
function pickBestQualityFromMulti(str: string): string {
  const entries: Array<{ quality: string; url: string }> = [];
  const re = /\[([^\]]+)\](https?:\/\/[^\s,\[]+)/g;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(str)) !== null) {
    entries.push({ quality: m[1], url: m[2] });
  }

  if (entries.length === 0) {
    // No bracketed entries — return str if it looks like URL
    return str.startsWith('http') ? str : '';
  }

  for (const q of QUALITY_PRIORITY) {
    const match = entries.find((e) => e.quality.toLowerCase().includes(q));
    if (match) return match.url;
  }
  return entries[0].url;
}

function extractQualityLabel(str: string): string | undefined {
  const m = str.match(/\[(\d+p)\]/i);
  return m?.[1];
}

// Domains that require a spoofed Referer (T-S048)
// ashdi.vip and bazon.tv validate Referer on embed requests
const REFERER_OVERRIDE: Record<string, string> = {
  'ashdi.vip':  'https://kinogo.cc/',
  'bazon.tv':   'https://kinogo.cc/',
  'bazon.biz':  'https://kinogo.cc/',
};

async function fetchHtml(url: string, refererOverride?: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, '');
  const referer = refererOverride ?? REFERER_OVERRIDE[hostname] ?? (parsed.origin + '/');
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        Referer: referer,
        Origin: parsed.origin,
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Extract page title from <title> tag */
function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim().replace(/\s*[-–|].*$/, '').trim() : 'Video';
}

/** Extract og:image for poster */
function extractPoster(html: string): string {
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

/**
 * fayllar1.ru/player/player.html?file=DIRECT_MP4_URL
 * Used by asilmedia.org — MP4 URL is in the ?file= query parameter.
 * If the URL is a fayllar player page, extract the file param directly.
 */
function extractFayllarDirectUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/fayllar\d*\.ru/i.test(parsed.hostname)) return null;
    if (!parsed.pathname.includes('player.html')) return null;
    const file = parsed.searchParams.get('file');
    return file && file.startsWith('http') ? file : null;
  } catch {
    return null;
  }
}

/**
 * Parse asilmedia-style pages that embed fayllar1.ru iframes with ?file=MP4_URL.
 * Returns multiple quality options (480p, 720p, 1080p) sorted by quality.
 */
const FAYLLAR_IFRAME_RE = /<iframe[^>]+src=["']([^"']*fayllar\d*\.ru\/player\/player\.html\?file=[^"']+)["']/gi;

function extractFayllarIframes(html: string): Array<{ url: string; quality: string }> {
  FAYLLAR_IFRAME_RE.lastIndex = 0;
  const results: Array<{ url: string; quality: string }> = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = FAYLLAR_IFRAME_RE.exec(html)) !== null) {
    const iframeSrc = m[1].startsWith('http') ? m[1] : `http:${m[1]}`;
    const directUrl = extractFayllarDirectUrl(iframeSrc);
    if (directUrl) {
      const qMatch = directUrl.match(/(\d{3,4})p/i);
      results.push({ url: directUrl, quality: qMatch ? `${qMatch[1]}p` : 'unknown' });
    }
  }
  return results;
}

export async function playerjsExtractor(rawUrl: string): Promise<VideoExtractResult | null> {
  // If URL is a direct fayllar player link (fayllar1.ru/player/player.html?file=...)
  const fayllarDirect = extractFayllarDirectUrl(rawUrl);
  if (fayllarDirect) {
    const type = /\.m3u8|\/hls\//i.test(fayllarDirect) ? 'hls' : 'mp4';
    return {
      title: 'Video',
      videoUrl: fayllarDirect,
      poster: '',
      platform: 'playerjs',
      type,
      sourceType: 'type1',
      extractionMethod: 'playerjs',
      cacheable: true,
    };
  }

  let html: string;
  try {
    html = await fetchHtml(rawUrl);
  } catch (err) {
    logger.warn('playerjsExtractor: fetch failed', { url: rawUrl, error: (err as Error).message });
    return null;
  }

  // Try fayllar1.ru iframe extraction (asilmedia.org pattern)
  const fayllarEntries = extractFayllarIframes(html);
  if (fayllarEntries.length > 0) {
    // Pick best quality: 1080p > 720p > 480p
    const sorted = fayllarEntries.sort((a, b) => {
      const aNum = parseInt(a.quality) || 0;
      const bNum = parseInt(b.quality) || 0;
      return bNum - aNum;
    });
    const best = sorted[0];
    const title = extractTitle(html);
    const poster = extractPoster(html);
    const type = /\.m3u8|\/hls\//i.test(best.url) ? 'hls' : 'mp4';

    logger.info('playerjsExtractor: fayllar iframe extracted', {
      url: rawUrl,
      bestUrl: best.url.slice(0, 80),
      quality: best.quality,
      totalQualities: sorted.length,
    });

    return {
      title,
      videoUrl: best.url,
      poster,
      platform: 'playerjs',
      type,
      sourceType: 'type1',
      extractionMethod: 'playerjs',
      cacheable: true,
    };
  }

  // Try standard Playerjs (new Playerjs({file: "..."}))
  let fileValue: string | null = null;

  const simpleMatch = PLAYERJS_RE.exec(html);
  if (simpleMatch) {
    fileValue = simpleMatch[2];
  } else {
    // Try to extract the full Playerjs({...}) object and parse file field
    const objMatch = PLAYERJS_OBJ_RE.exec(html);
    if (objMatch) {
      // Replace single-quoted keys so JSON.parse works
      const normalized = objMatch[1]
        .replace(/(['"])?([a-zA-Z_]+)(['"])?\s*:/g, '"$2":')
        .replace(/'/g, '"');
      try {
        const obj = JSON.parse(normalized) as { file?: string };
        if (obj.file) fileValue = obj.file;
      } catch {
        // ignore JSON parse error
      }
    }
  }

  if (!fileValue) {
    logger.warn('playerjsExtractor: Playerjs config not found in HTML', { url: rawUrl });
    return null;
  }

  const { bestUrl, episodes } = parsePlayerjsFile(fileValue);

  if (!bestUrl) {
    logger.warn('playerjsExtractor: could not pick best URL from file field', { url: rawUrl, fileValue: fileValue.slice(0, 200) });
    return null;
  }

  const type = /\.m3u8|\/hls\//i.test(bestUrl) ? 'hls' : 'mp4';
  const title = extractTitle(html);
  const poster = extractPoster(html);

  logger.info('playerjsExtractor: extracted', { url: rawUrl, bestUrl: bestUrl.slice(0, 80), episodes: episodes.length, type });

  return {
    title,
    videoUrl: bestUrl,
    poster,
    platform: 'playerjs',
    type,
    sourceType: 'type1',
    extractionMethod: 'playerjs',
    cacheable: true,
    episodes: episodes.length > 0 ? episodes : undefined,
  };
}
