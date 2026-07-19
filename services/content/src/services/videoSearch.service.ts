// CineSync — Video Search Service
// Searches YouTube (official Data API v3, falls back to yt-dlp if no key), Rutube (API),
// VK Video (yt-dlp) in parallel

import { spawn } from 'child_process';
import { fetch } from 'undici';
import { logger } from '@shared/utils/logger';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  logger.warn('video-search: YOUTUBE_API_KEY not set — falling back to yt-dlp ytsearch (less reliable)');
}

export interface VideoSearchItem {
  title: string;
  thumbnail: string;
  url: string;
  platform: 'youtube' | 'rutube' | 'vk';
  duration?: number;
  viewCount?: number;
}

const SEARCH_TIMEOUT_MS = 8_000;
const PER_PLATFORM = 5;

// ── yt-dlp search helper ────────────────────────────────────────────────────

function runYtDlpSearch(searchQuery: string): Promise<VideoSearchItem[]> {
  return new Promise((resolve) => {
    const args = [
      `ytsearch${PER_PLATFORM}:${searchQuery}`,
      '--dump-json',
      '--skip-download',
      '--quiet',
      '--no-warnings',
      '--no-playlist',
    ];

    const child = spawn('yt-dlp', args);
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => { child.kill(); resolve([]); }, SEARCH_TIMEOUT_MS);

    child.stdout.on('data', (d: Buffer) => chunks.push(d));
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const lines = Buffer.concat(chunks).toString().trim().split('\n').filter(Boolean);
        const results: VideoSearchItem[] = [];
        for (const line of lines) {
          const j = JSON.parse(line) as {
            title?: string;
            thumbnail?: string;
            webpage_url?: string;
            duration?: number;
            view_count?: number;
          };
          if (!j.webpage_url || !j.title) continue;
          results.push({
            title: j.title,
            thumbnail: j.thumbnail ?? '',
            url: j.webpage_url,
            platform: 'youtube',
            duration: j.duration,
            viewCount: j.view_count,
          });
        }
        resolve(results);
      } catch {
        resolve([]);
      }
    });
    child.on('error', () => { clearTimeout(timer); resolve([]); });
  });
}

function runYtDlpVkSearch(query: string): Promise<VideoSearchItem[]> {
  return new Promise((resolve) => {
    // yt-dlp flat-playlist on VK video search page
    const searchUrl = `https://vk.com/video?q=${encodeURIComponent(query)}&section=search`;
    const args = [
      searchUrl,
      '--flat-playlist',
      '--dump-json',
      '--quiet',
      '--no-warnings',
      '--playlist-items', `1-${PER_PLATFORM}`,
    ];

    const child = spawn('yt-dlp', args);
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => { child.kill(); resolve([]); }, SEARCH_TIMEOUT_MS);

    child.stdout.on('data', (d: Buffer) => chunks.push(d));
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const lines = Buffer.concat(chunks).toString().trim().split('\n').filter(Boolean);
        const results: VideoSearchItem[] = [];
        for (const line of lines) {
          const j = JSON.parse(line) as {
            title?: string;
            thumbnail?: string;
            url?: string;
            webpage_url?: string;
            duration?: number;
          };
          const url = j.webpage_url ?? j.url;
          if (!url || !j.title) continue;
          results.push({
            title: j.title,
            thumbnail: j.thumbnail ?? '',
            url,
            platform: 'vk',
            duration: j.duration,
          });
        }
        resolve(results);
      } catch {
        resolve([]);
      }
    });
    child.on('error', () => { clearTimeout(timer); resolve([]); });
  });
}

// ── YouTube Data API v3 search (official — preferred over yt-dlp's ytsearch) ─────────────────

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
    };
  }>;
}

async function searchYouTubeOfficial(query: string): Promise<VideoSearchItem[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${PER_PLATFORM}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEARCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) {
      logger.warn('YouTube Data API search failed', { status: res.status });
      return [];
    }
    const data = await res.json() as YouTubeSearchResponse;
    return (data.items ?? [])
      .filter((item) => item.id?.videoId && item.snippet?.title)
      .map((item) => ({
        title: item.snippet!.title!,
        thumbnail: item.snippet!.thumbnails?.medium?.url ?? item.snippet!.thumbnails?.default?.url ?? '',
        url: `https://www.youtube.com/watch?v=${item.id!.videoId}`,
        platform: 'youtube' as const,
      }));
  } catch (e) {
    logger.warn('YouTube Data API search error', { error: (e as Error).message });
    return [];
  }
}

// ── Rutube API search ────────────────────────────────────────────────────────

interface RutubeSearchResult {
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
  hits: number;
}

interface RutubeApiResponse {
  results?: RutubeSearchResult[];
}

async function searchRutube(query: string): Promise<VideoSearchItem[]> {
  try {
    const url = `https://rutube.ru/api/search/video/?query=${encodeURIComponent(query)}&page=1&per_page=${PER_PLATFORM}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEARCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CineSync/1.0)' },
    });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json() as RutubeApiResponse;

    return (data.results ?? []).map((item) => ({
      title: item.title,
      thumbnail: item.thumbnail_url ?? '',
      url: item.video_url ?? `https://rutube.ru/video/`,
      platform: 'rutube' as const,
      duration: item.duration,
      viewCount: item.hits,
    }));
  } catch {
    return [];
  }
}

// ── Main search ──────────────────────────────────────────────────────────────

export async function searchVideos(query: string): Promise<VideoSearchItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  logger.info('video-search', { query: trimmed });

  const [youtube, rutube, vk] = await Promise.allSettled([
    YOUTUBE_API_KEY ? searchYouTubeOfficial(trimmed) : runYtDlpSearch(trimmed),
    searchRutube(trimmed),
    runYtDlpVkSearch(trimmed),
  ]);

  const ytResults  = youtube.status  === 'fulfilled' ? youtube.value  : [];
  const rtResults  = rutube.status   === 'fulfilled' ? rutube.value   : [];
  const vkResults  = vk.status       === 'fulfilled' ? vk.value       : [];

  // Interleave: yt, rt, vk, yt, rt, vk ...
  const merged: VideoSearchItem[] = [];
  const max = Math.max(ytResults.length, rtResults.length, vkResults.length);
  for (let i = 0; i < max; i++) {
    if (ytResults[i]) merged.push(ytResults[i]);
    if (rtResults[i]) merged.push(rtResults[i]);
    if (vkResults[i]) merged.push(vkResults[i]);
  }

  return merged;
}
