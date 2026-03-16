// CineSync — Universal Video Extractor — yt-dlp Fallback
// Calls system yt-dlp binary via child_process for platforms not handled by ytdl-core

import { spawn } from 'child_process';
import { VideoExtractResult, VideoType } from './types';

const YTDLP_TIMEOUT_MS = 30_000; // 30s max

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

function pickBestUrl(data: YtDlpJson): { url: string; type: VideoType } | null {
  // Direct URL (already resolved by yt-dlp for formats with single stream)
  if (data.url) {
    const type: VideoType = /m3u8|hls/.test(data.protocol ?? '') ? 'hls' : 'mp4';
    return { url: data.url, type };
  }

  if (!data.formats?.length) return null;

  // Prefer combined audio+video stream, mp4 container, highest resolution ≤ 1080p
  const combined = data.formats.filter(
    (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none',
  );
  const ranked = [...(combined.length ? combined : data.formats)].sort(
    (a, b) => (b.height ?? 0) - (a.height ?? 0),
  );

  // Cap at 1080p
  const capped = ranked.find((f) => (f.height ?? 9999) <= 1080) ?? ranked[0];
  if (!capped?.url) return null;

  const proto = capped.protocol ?? '';
  const type: VideoType = /m3u8|hls/.test(proto) || capped.ext === 'm3u8' ? 'hls' : 'mp4';
  return { url: capped.url, type };
}

export async function ytDlpExtractor(
  rawUrl: string,
): Promise<VideoExtractResult | null> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const child = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout', '10',
      rawUrl,
    ]);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(null);
    }, YTDLP_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0 || !stdout.trim()) {
        resolve(null);
        return;
      }

      try {
        // yt-dlp can output multiple JSON lines for playlists; take first
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
