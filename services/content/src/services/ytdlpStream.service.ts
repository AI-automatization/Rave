// T-S074: yt-dlp based YouTube stream info — fallback when ytdl-core fails
import { spawn } from 'child_process';
import { LRUCache } from 'lru-cache';
import { logger } from '@shared/utils/logger';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface YtDlpStreamInfo {
  url: string;
  mimeType: string;
  contentLength: number;
  isLive: boolean;
}

const CACHE_TTL = 5 * 60 * 60 * 1000; // 5h — googlevideo URLs stay valid ~6h
const cache = new LRUCache<string, YtDlpStreamInfo>({ max: 50, ttl: CACHE_TTL });

// Reuse env vars from ytDlpExtractor context
const YT_PO_TOKEN = process.env.YOUTUBE_PO_TOKEN;
const YT_VISITOR_DATA = process.env.YOUTUBE_VISITOR_DATA;

// Write cookie file once at module load (same as ytDlpExtractor)
const YT_COOKIE_FILE: string | null = (() => {
  const raw = process.env.YOUTUBE_COOKIES_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    const lines = [
      '# Netscape HTTP Cookie File',
      ...parsed.map((c) => {
        const domain = String(c.domain ?? '.youtube.com');
        const flag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const path = String(c.path ?? '/');
        const secure = String(c.secure ?? false).toUpperCase();
        const exp = Math.floor(Number(c.expirationDate ?? 0));
        return `${domain}\t${flag}\t${path}\t${secure}\t${exp}\t${c.name}\t${c.value}`;
      }),
    ];
    const file = join(tmpdir(), 'yt_stream_cookies.txt');
    writeFileSync(file, lines.join('\n'));
    return file;
  } catch {
    return null;
  }
})();

function buildExtractorArgs(): string {
  const parts = ['player-client=ios,web'];
  if (YT_PO_TOKEN) parts.push(`po_token=ios+${YT_PO_TOKEN}`);
  if (YT_VISITOR_DATA) parts.push(`visitor_data=${YT_VISITOR_DATA}`);
  return `youtube:${parts.join(';')}`;
}

export async function getYtDlpStreamInfo(youtubeUrl: string): Promise<YtDlpStreamInfo> {
  const hit = cache.get(youtubeUrl);
  if (hit) return hit;

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const args = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout', '15',
      // Single-stream format: combined av for direct piping (no mux needed)
      '--format', 'best[ext=mp4][height<=720]/best[ext=mp4]/best',
      '--extractor-args', buildExtractorArgs(),
      ...(YT_COOKIE_FILE ? ['--cookies', YT_COOKIE_FILE] : []),
      youtubeUrl,
    ];

    const child = spawn('yt-dlp', args);
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('yt-dlp stream info timeout'));
    }, 25_000);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (!stdout.trim()) {
        logger.warn('ytdlp-stream: no output', { code, stderr: stderr.slice(0, 200), url: youtubeUrl });
        reject(new Error(`yt-dlp exited ${code} with no output`));
        return;
      }
      try {
        const data = JSON.parse(stdout) as Record<string, unknown>;
        const url = (data.url as string) ?? (data.manifest_url as string);
        if (!url) { reject(new Error('No URL in yt-dlp JSON')); return; }

        const ext = (data.ext as string) ?? 'mp4';
        const isLive = !!(data.is_live as boolean);
        const mimeType = isLive
          ? 'application/x-mpegURL'
          : ext === 'webm' ? 'video/webm' : 'video/mp4';
        const contentLength = Number((data.filesize as number) ?? (data.filesize_approx as number) ?? 0);

        const result: YtDlpStreamInfo = { url, mimeType, contentLength, isLive };
        cache.set(youtubeUrl, result);
        logger.info('ytdlp-stream: resolved', { url: youtubeUrl, ext, contentLength, isLive });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}
