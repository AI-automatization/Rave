// CineSync Mobile — Video extraction hook
import { useState, useCallback } from 'react';
import { contentApi, VideoExtractResult } from '@api/content.api';
import { useAuthStore } from '@store/auth.store';

const EXTRACTION_TIMEOUT_MS = 15_000;

const CONTENT_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_URL ?? '';

/** File extensions that indicate a direct playable URL (no extraction needed) */
const DIRECT_EXTENSIONS = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi', '.mov'];

interface UseVideoExtractionReturn {
  isExtracting: boolean;
  result: VideoExtractResult | null;
  error: string | null;
  fallbackMode: boolean;
  extract: (url: string) => Promise<void>;
  reset: () => void;
}

/**
 * Detects if a URL points directly to a video file (no extraction needed).
 * Strips query params before checking the extension.
 */
function isDirectVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return DIRECT_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Infers the video type from a direct URL extension.
 */
function inferVideoType(url: string): 'mp4' | 'hls' {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith('.m3u8')) return 'hls';
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
  return `${CONTENT_BASE_URL}/api/v1/youtube/stream?url=${encoded}&token=${token}`;
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
      // 1. Direct video URL — skip extraction entirely
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

      // 2. Extract via backend with timeout
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
  }, []);

  return { isExtracting, result, error, fallbackMode, extract, reset };
}
