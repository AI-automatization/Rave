// WeWatch Mobile — Video extraction hook
import { useState, useCallback } from 'react';
import { contentApi, VideoExtractResult } from '@api/content.api';
import { useAuthStore } from '@store/auth.store';

const EXTRACTION_TIMEOUT_MS = 15_000;

const CONTENT_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_URL ?? '';


interface UseVideoExtractionReturn {
  isExtracting: boolean;
  result: VideoExtractResult | null;
  /** Quality options from extracted result (empty array if backend returned none) */
  qualities: NonNullable<VideoExtractResult['qualities']>;
  /** Episode list from extracted result (empty array if backend returned none) */
  episodes: NonNullable<VideoExtractResult['episodes']>;
  error: string | null;
  fallbackMode: boolean;
  extract: (url: string) => Promise<void>;
  reset: () => void;
}

/**
 * Mirror of isRealVideoSrc() in mediaDetector.ts — must match exactly so a URL
 * that JS detection accepts is also accepted here (no iframe fallback gap).
 */
function isDirectVideoUrl(url: string): boolean {
  try {
    if (!url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    if (lower.includes('videoplayback') || lower.includes('googlevideo')) return false;
    if (/\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\?|#|$)/i.test(lower)) return true;
    if (/\/(stream|playlist\.m3u8|manifest\.m3u8|master\.m3u8|manifest|hls|dash|chunklist)/i.test(lower)) return true;
    if (/\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i.test(lower)) return true;
    if (lower.includes('fbcdn.net') && lower.includes('.mp4')) return true;
    if (lower.includes('cdninstagram.com') && lower.includes('.mp4')) return true;
    if (lower.includes('v.redd.it')) return true;
    if (lower.includes('streamable.com') && lower.includes('.mp4')) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Infers the video type from a direct URL extension or CDN path.
 */
function inferVideoType(url: string): 'mp4' | 'hls' {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith('.m3u8')) return 'hls';
    // CDN HLS paths without extension (e.g. /hls/stream, /video/abc/index)
    if (/\/(hls|stream|playlist|manifest|chunklist|master|index)/i.test(pathname)) return 'hls';
  } catch {
    // fallback
  }
  return 'mp4';
}

/**
 * Builds a proxied YouTube stream URL via the content service.
 * Token passed as query param since expo-av can't set auth headers.
 */
function buildYouTubeProxyUrl(videoUrl: string, token: string): string {
  const encoded = encodeURIComponent(videoUrl);
  return `${CONTENT_BASE_URL}/youtube/stream?url=${encoded}&token=${token}`;
}

/**
 * Runs a promise with an AbortController-based timeout.
 * Returns the result or throws on timeout / abort.
 */
function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fn(controller.signal).finally(() => clearTimeout(timer));
}

/**
 * Imperative hook for one-time video URL extraction.
 *
 * - Direct URLs (.mp4, .m3u8) bypass extraction entirely.
 * - Uses `contentApi.extractVideo` with a 15 s timeout.
 * - On failure sets `fallbackMode = true` so the caller can switch to WebView.
 * - For YouTube results with `useProxy`, rewrites the videoUrl through the proxy.
 */
export function useVideoExtraction(): UseVideoExtractionReturn {
  const accessToken = useAuthStore(s => s.accessToken);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<VideoExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const reset = useCallback(() => {
    setIsExtracting(false);
    setResult(null);
    setError(null);
    setFallbackMode(false);
  }, []);

  const extract = useCallback(async (url: string): Promise<void> => {
    // Reset previous state
    setResult(null);
    setError(null);
    setFallbackMode(false);
    setIsExtracting(true);

    try {
      // 1. googlevideo.com URLs are IP-locked to the extraction server — cannot be played directly.
      //    This happens when an old room stored the extracted CDN URL instead of the original URL.
      if (/googlevideo\.com/.test(url)) {
        if (__DEV__) console.log('[useVideoExtraction] googlevideo.com CDN URL — IP-locked, cannot play directly');
        setError('video_source_expired');
        setFallbackMode(true);
        return;
      }

      // 2. Direct video URL — skip extraction entirely
      if (isDirectVideoUrl(url)) {
        const directResult: VideoExtractResult = {
          title: '',
          videoUrl: url,
          poster: '',
          platform: 'generic',
          type: inferVideoType(url),
        };

        if (__DEV__) console.log('[useVideoExtraction] Direct URL detected:', url);

        setResult(directResult);
        return;
      }

      // 2. Non-HTTP URLs (about:srcdoc, blob:, data:, etc.) are not extractable
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (__DEV__) console.log('[useVideoExtraction] Non-HTTP URL — skipping extraction, using WebView fallback');
        setFallbackMode(true);
        return;
      }

      // 3. Extract via backend with timeout
      const extracted = await withTimeout<VideoExtractResult>(
        (signal) =>
          new Promise<VideoExtractResult>((resolve, reject) => {
            signal.addEventListener('abort', () =>
              reject(new Error('Extraction timed out')),
            );

            contentApi
              .extractVideo(url)
              .then(resolve)
              .catch(reject);
          }),
        EXTRACTION_TIMEOUT_MS,
      );

      if (__DEV__) console.log('[useVideoExtraction] Extracted:', extracted.platform, extracted.type);

      // 3. YouTube proxy rewrite when backend says so
      if (extracted.useProxy && extracted.platform === 'youtube') {
        extracted.videoUrl = buildYouTubeProxyUrl(extracted.videoUrl, accessToken ?? '');

        if (__DEV__) console.log('[useVideoExtraction] Proxy URL applied');
      }

      setResult(extracted);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Video extraction failed';

      if (__DEV__) console.log('[useVideoExtraction] Error:', message);

      setError(message);
      setFallbackMode(true);
    } finally {
      setIsExtracting(false);
    }
  }, [accessToken]);

  return {
    isExtracting,
    result,
    qualities: result?.qualities ?? [],
    episodes: result?.episodes ?? [],
    error,
    fallbackMode,
    extract,
    reset,
  };
}
