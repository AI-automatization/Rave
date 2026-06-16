// CineSync — Universal Video Extractor — yt-dlp Fallback
// Calls system yt-dlp binary via child_process for platforms not handled by ytdl-core

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { VideoExtractResult, VideoType } from './types';
import { logger } from '@shared/utils/logger';

/** Thrown when yt-dlp detects DRM-protected content */
export class YtDlpDrmError extends Error {
  constructor() {
    super('DRM protected content');
    this.name = 'YtDlpDrmError';
  }
}

const DRM_RE = /drm|widevine|encrypted|protected/i;
const NETWORK_ERR_RE = /urlopen error|connection reset|network is unreachable|temporary failure|eof occurred|ssl.*error|read timed out/i;
const YTDLP_TIMEOUT_MS = 20_000;

interface YtDlpJson {
  title?: string;
  thumbnail?: string;
  duration?: number;
  url?: string;
  urls?: string;
  formats?: Array<{
    url?: string;
    vcodec?: string;
    acodec?: string;
    ext?: string;
    protocol?: string;
    format_note?: string;
    height?: number;
    http_headers?: Record<string, string>;
  }>;
  extractor?: string;
  is_live?: boolean;
  protocol?: string;
  http_headers?: Record<string, string>;
}

// ── YouTube cookie file ────────────────────────────────────────────────────────
// YOUTUBE_COOKIES_JSON: JSON array from "Cookie-Editor" browser extension
// Converted to Netscape format for yt-dlp --cookies flag
interface YtCookieEntry {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  expirationDate?: number;
}

function toNetscapeCookies(cookies: YtCookieEntry[]): string {
  const lines = ['# Netscape HTTP Cookie File'];
  for (const c of cookies) {
    const domain = c.domain ?? '.youtube.com';
    const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = c.path ?? '/';
    const secure = c.secure ? 'TRUE' : 'FALSE';
    // expirationDate = unix seconds (Chrome DevTools format)
    const expires = Math.floor(c.expirationDate ?? 2147483647);
    lines.push(`${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
  }
  return lines.join('\n');
}

// Create cookie file once at module init (reused across all yt-dlp calls)
const YT_COOKIE_FILE: string | null = (() => {
  const raw = process.env.YOUTUBE_COOKIES_JSON;
  if (!raw) return null;
  try {
    const cookies = JSON.parse(raw) as YtCookieEntry[];
    const filePath = join(tmpdir(), `yt_cookies_${process.pid}.txt`);
    writeFileSync(filePath, toNetscapeCookies(cookies), 'utf8');
    logger.info('yt-dlp: cookie file created', { path: filePath, cookieCount: cookies.length });
    return filePath;
  } catch (e) {
    logger.warn('yt-dlp: cookie file creation failed', { error: (e as Error).message });
    return null;
  }
})();

// ── YouTube poToken + visitorData ──────────────────────────────────────────────
// YOUTUBE_PO_TOKEN: proof-of-origin token (get via youtube-po-token-generator or browser)
// YOUTUBE_VISITOR_DATA: visitor data from YouTube session (usually needed with poToken)
const YT_PO_TOKEN = process.env.YOUTUBE_PO_TOKEN;
const YT_VISITOR_DATA = process.env.YOUTUBE_VISITOR_DATA;

if (!YT_PO_TOKEN) {
  logger.warn('yt-dlp: YOUTUBE_PO_TOKEN is not set — YouTube extraction may fail bot checks. Set it in .env');
}

// ── VK cookie file ─────────────────────────────────────────────────────────────
// VK_COOKIES_JSON: JSON array from "Cookie-Editor" browser extension (logged-in vk.com session)
// VK blocks datacenter IPs and requires an authenticated session for most videos.
const VK_COOKIE_FILE: string | null = (() => {
  const raw = process.env.VK_COOKIES_JSON;
  if (!raw) return null;
  try {
    const cookies = JSON.parse(raw) as YtCookieEntry[];
    // Default domain to .vk.com for entries without explicit domain
    const netscape = (() => {
      const lines = ['# Netscape HTTP Cookie File'];
      for (const c of cookies) {
        const domain = c.domain ?? '.vk.com';
        const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const path = c.path ?? '/';
        const secure = c.secure ? 'TRUE' : 'FALSE';
        const expires = Math.floor(c.expirationDate ?? 2147483647);
        lines.push(`${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
      }
      return lines.join('\n');
    })();
    const filePath = join(tmpdir(), `vk_cookies_${process.pid}.txt`);
    writeFileSync(filePath, netscape, 'utf8');
    logger.info('yt-dlp: VK cookie file created', { path: filePath, cookieCount: cookies.length });
    return filePath;
  } catch (e) {
    logger.warn('yt-dlp: VK cookie file creation failed', { error: (e as Error).message });
    return null;
  }
})();

function buildYouTubeExtractorArgs(): string {
  // ios client: no poToken required, better datacenter IP tolerance than WEB/MWEB
  const parts = ['player-client=ios,web'];
  if (YT_PO_TOKEN) parts.push(`po_token=ios+${YT_PO_TOKEN}`);
  if (YT_VISITOR_DATA) parts.push(`visitor_data=${YT_VISITOR_DATA}`);
  return `youtube:${parts.join(';')}`;
}

// ── Format selection ───────────────────────────────────────────────────────────

/** VK CDN: /type/5/ = ad pre-roll stream — prefer /type/3/ (main video) */
const isVkAdStream = (url: string): boolean => /\/type\/5\//.test(url);

function pickBestUrl(data: YtDlpJson): { url: string; type: VideoType; headers?: Record<string, string> } | null {
  // Skip top-level URL if it's a VK ad stream — fall through to formats for a better pick
  if (data.url && !isVkAdStream(data.url)) {
    const type: VideoType = /m3u8|hls/.test(data.protocol ?? '') ? 'hls' : 'mp4';
    return { url: data.url, type, headers: data.http_headers };
  }

  if (!data.formats?.length) {
    // No formats — return top-level URL even if it's a VK ad (better than null)
    if (data.url) {
      const type: VideoType = /m3u8|hls/.test(data.protocol ?? '') ? 'hls' : 'mp4';
      return { url: data.url, type, headers: data.http_headers };
    }
    return null;
  }

  const nonAdFormats = data.formats.filter(f => !isVkAdStream(f.url ?? ''));
  const formatsToRank = nonAdFormats.length > 0 ? nonAdFormats : data.formats;
  const combined = formatsToRank.filter(
    (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none',
  );
  const ranked = [...(combined.length ? combined : formatsToRank)].sort(
    (a, b) => (b.height ?? 0) - (a.height ?? 0),
  );
  const capped = ranked.find((f) => (f.height ?? 9999) <= 1080) ?? ranked[0];
  if (!capped?.url) return null;

  const proto = capped.protocol ?? '';
  const type: VideoType = /m3u8|hls/.test(proto) || capped.ext === 'm3u8' ? 'hls' : 'mp4';
  return { url: capped.url, type, headers: capped.http_headers ?? data.http_headers };
}

export async function ytDlpExtractor(
  rawUrl: string,
  cookies?: string,
  _isRetry = false,
): Promise<VideoExtractResult | null> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const isYouTube = /youtube\.com|youtu\.be/.test(rawUrl);

    const args: string[] = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout', '10',
      // Use flexible format selection — specific formats may not be available on some videos
      '--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    ];

    const isVk = /vk\.com|vkvideo\.ru/.test(rawUrl);

    // YouTube-specific: ios player client + cookies
    if (isYouTube) {
      args.push('--extractor-args', buildYouTubeExtractorArgs());
      if (YT_COOKIE_FILE) args.push('--cookies', YT_COOKIE_FILE);
    }

    // VK requires authenticated session cookies — datacenter IPs are blocked without login
    if (isVk && VK_COOKIE_FILE) {
      args.push('--cookies', VK_COOKIE_FILE);
    }

    // Per-request cookie header (for auth-protected non-YouTube sites, T-S045)
    // Strip CRLF to prevent header injection in yt-dlp's HTTP requests
    if (cookies && cookies.length <= 4096 && !isYouTube && !isVk) {
      const safeCookies = cookies.replace(/[\r\n]/g, '');
      args.push('--add-header', `Cookie:${safeCookies}`);
    }

    args.push(rawUrl);

    const child = spawn('yt-dlp', args);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(null);
    }, YTDLP_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0 || !stdout.trim()) {
        if (DRM_RE.test(stderr)) {
          reject(new YtDlpDrmError());
          return;
        }
        if (NETWORK_ERR_RE.test(stderr) && !_isRetry) {
          logger.warn('yt-dlp: network error, retrying in 1s', { url: rawUrl, stderr: stderr.slice(0, 200) });
          // Retry once after 1s — resolves the outer promise via recursive call
          setTimeout(() => {
            ytDlpExtractor(rawUrl, cookies, true).then(resolve).catch(reject);
          }, 1_000);
          return;
        }
        if (isYouTube) {
          logger.warn('yt-dlp YouTube extraction failed', {
            code,
            stderr: stderr.slice(0, 300),
            hasCookies: !!YT_COOKIE_FILE,
            hasPoToken: !!YT_PO_TOKEN,
          });
        }
        if (isVk) {
          logger.warn('yt-dlp VK extraction failed', {
            code,
            stderr: stderr.slice(0, 300),
            hasCookies: !!VK_COOKIE_FILE,
            hint: VK_COOKIE_FILE ? 'VK cookies loaded but extraction failed' : 'Set VK_COOKIES_JSON env var with vk.com session cookies',
          });
        }
        resolve(null);
        return;
      }

      try {
        const firstLine = stdout.trim().split('\n')[0];
        const data = JSON.parse(firstLine) as YtDlpJson;

        const best = pickBestUrl(data);
        if (!best) { resolve(null); return; }

        resolve({
          title: data.title ?? 'Video',
          videoUrl: best.url,
          poster: data.thumbnail ?? '',
          platform: 'generic',
          type: best.type,
          duration: typeof data.duration === 'number' ? data.duration : undefined,
          isLive: data.is_live ?? false,
          httpHeaders: best.headers,
        });
      } catch {
        resolve(null);
      }
    });

    child.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

/** Returns true if yt-dlp binary is available on PATH */
export async function isYtDlpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('yt-dlp', ['--version']);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}
