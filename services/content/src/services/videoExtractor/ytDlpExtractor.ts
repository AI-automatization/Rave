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
  }>;
  extractor?: string;
  is_live?: boolean;
  protocol?: string;
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

function buildYouTubeExtractorArgs(): string | null {
  if (!YT_PO_TOKEN) return null;
  // Use MWEB client — less strict bot detection than WEB
  const parts = ['player-client=MWEB'];
  parts.push(`po_token=MWEB+${YT_PO_TOKEN}`);
  if (YT_VISITOR_DATA) parts.push(`visitor_data=${YT_VISITOR_DATA}`);
  return `youtube:${parts.join(';')}`;
}

// ── Format selection ───────────────────────────────────────────────────────────
function pickBestUrl(data: YtDlpJson): { url: string; type: VideoType } | null {
  if (data.url) {
    const type: VideoType = /m3u8|hls/.test(data.protocol ?? '') ? 'hls' : 'mp4';
    return { url: data.url, type };
  }
  if (!data.formats?.length) return null;

  const combined = data.formats.filter(
    (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none',
  );
  const ranked = [...(combined.length ? combined : data.formats)].sort(
    (a, b) => (b.height ?? 0) - (a.height ?? 0),
  );
  const capped = ranked.find((f) => (f.height ?? 9999) <= 1080) ?? ranked[0];
  if (!capped?.url) return null;

  const proto = capped.protocol ?? '';
  const type: VideoType = /m3u8|hls/.test(proto) || capped.ext === 'm3u8' ? 'hls' : 'mp4';
  return { url: capped.url, type };
}

export async function ytDlpExtractor(
  rawUrl: string,
  cookies?: string,
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
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    ];

    // YouTube-specific: use cookie file + poToken
    if (isYouTube) {
      if (YT_COOKIE_FILE) {
        args.push('--cookies', YT_COOKIE_FILE);
      }
      const extractorArgs = buildYouTubeExtractorArgs();
      if (extractorArgs) {
        args.push('--extractor-args', extractorArgs);
      }
    }

    // Per-request cookie header (for auth-protected non-YouTube sites, T-S045)
    if (cookies && cookies.length <= 4096 && !isYouTube) {
      args.push('--add-header', `Cookie:${cookies}`);
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
        if (isYouTube) {
          logger.warn('yt-dlp YouTube extraction failed', {
            code,
            stderr: stderr.slice(0, 300),
            hasCookies: !!YT_COOKIE_FILE,
            hasPoToken: !!YT_PO_TOKEN,
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
