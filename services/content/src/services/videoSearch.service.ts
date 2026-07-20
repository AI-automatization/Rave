// CineSync — Video Search Service
// Searches YouTube (official Data API v3, falls back to yt-dlp if no key), Rutube (API),
// VK Video (yt-dlp), Dailymotion (official public API, no key required), PeerTube (SepiaSearch —
// the real cross-instance PeerTube search engine at joinpeertube.org, no key required) and
// YouTube Live (same Data API key, eventType=live) in parallel.
//
// Twitch/Vimeo were considered too (both have official search APIs) but both require registering
// a developer app for OAuth client-credentials (TWITCH_CLIENT_ID/SECRET, VIMEO_ACCESS_TOKEN) —
// nothing to fake here without those, so they're not wired up. TikTok has no usable public search
// API without a restrictive partner review process. Trovo/Cinerama/Web have no video-level search
// API at all (Cinerama is a small standalone site, Web is an arbitrary-URL fallback) — those
// platforms keep the popup-browse-then-paste-link flow in CreateRoomDialog.tsx.

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
  platform: 'youtube' | 'rutube' | 'vk' | 'dailymotion' | 'peertube' | 'live';
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

// ── Dailymotion — official public search API, no key required ────────────────

interface DailymotionSearchResponse {
  list?: Array<{
    id?: string;
    title?: string;
    thumbnail_url?: string;
    duration?: number;
    views_total?: number;
  }>;
}

async function searchDailymotion(query: string): Promise<VideoSearchItem[]> {
  try {
    const url = `https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&fields=id,title,thumbnail_url,duration,views_total&limit=${PER_PLATFORM}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEARCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json() as DailymotionSearchResponse;
    return (data.list ?? [])
      .filter((item) => item.id && item.title)
      .map((item) => ({
        title: item.title!,
        thumbnail: item.thumbnail_url ?? '',
        url: `https://www.dailymotion.com/video/${item.id}`,
        platform: 'dailymotion' as const,
        duration: item.duration,
        viewCount: item.views_total,
      }));
  } catch {
    return [];
  }
}

// ── PeerTube — via SepiaSearch (search.joinpeertube.org), the real cross-instance search
// engine for the whole federated network. PeerTube itself has no single global search — each
// instance only searches its own catalog — so SepiaSearch (run by the PeerTube project itself)
// is the only way to search "PeerTube" as a platform rather than one arbitrary instance. No key
// required. Its `url` field is already the exact /videos/watch/{uuid} shape our own
// extractPeerTubeIds (apps/app-web + apps/mobile) expects. ─────────────────────

interface SepiaSearchResponse {
  data?: Array<{
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    duration?: number;
    views?: number;
  }>;
}

async function searchPeerTube(query: string): Promise<VideoSearchItem[]> {
  try {
    const url = `https://search.joinpeertube.org/api/v1/search/videos?search=${encodeURIComponent(query)}&count=${PER_PLATFORM}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEARCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json() as SepiaSearchResponse;
    return (data.data ?? [])
      .filter((item) => item.url && item.name)
      .map((item) => ({
        title: item.name!,
        thumbnail: item.thumbnailUrl ?? '',
        url: item.url!,
        platform: 'peertube' as const,
        duration: item.duration,
        viewCount: item.views,
      }));
  } catch {
    return [];
  }
}

// ── YouTube Live — same Data API key as regular YouTube search, eventType=live filters to
// channels currently streaming. Skipped entirely without a key (no yt-dlp fallback attempted —
// yt-dlp has no dedicated "live search" mode worth relying on). ──────────────

async function searchYouTubeLive(query: string): Promise<VideoSearchItem[]> {
  if (!YOUTUBE_API_KEY) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&maxResults=${PER_PLATFORM}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEARCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) {
      logger.warn('YouTube Live search failed', { status: res.status });
      return [];
    }
    const data = await res.json() as YouTubeSearchResponse;
    return (data.items ?? [])
      .filter((item) => item.id?.videoId && item.snippet?.title)
      .map((item) => ({
        title: item.snippet!.title!,
        thumbnail: item.snippet!.thumbnails?.medium?.url ?? item.snippet!.thumbnails?.default?.url ?? '',
        url: `https://www.youtube.com/watch?v=${item.id!.videoId}`,
        platform: 'live' as const,
      }));
  } catch (e) {
    logger.warn('YouTube Live search error', { error: (e as Error).message });
    return [];
  }
}

// ── Main search ──────────────────────────────────────────────────────────────

export async function searchVideos(query: string): Promise<VideoSearchItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  logger.info('video-search', { query: trimmed });

  const [youtube, rutube, vk, dailymotion, peertube, live] = await Promise.allSettled([
    YOUTUBE_API_KEY ? searchYouTubeOfficial(trimmed) : runYtDlpSearch(trimmed),
    searchRutube(trimmed),
    runYtDlpVkSearch(trimmed),
    searchDailymotion(trimmed),
    searchPeerTube(trimmed),
    searchYouTubeLive(trimmed),
  ]);

  const results = [
    youtube.status     === 'fulfilled' ? youtube.value     : [],
    rutube.status      === 'fulfilled' ? rutube.value      : [],
    vk.status          === 'fulfilled' ? vk.value          : [],
    dailymotion.status === 'fulfilled' ? dailymotion.value : [],
    peertube.status    === 'fulfilled' ? peertube.value    : [],
    live.status        === 'fulfilled' ? live.value        : [],
  ];

  // Interleave round-robin across every platform that returned results, instead of one
  // platform (e.g. YouTube) dominating the top of the list just by returning more matches.
  const merged: VideoSearchItem[] = [];
  const max = Math.max(...results.map((r) => r.length));
  for (let i = 0; i < max; i++) {
    for (const platformResults of results) {
      if (platformResults[i]) merged.push(platformResults[i]);
    }
  }

  return merged;
}
