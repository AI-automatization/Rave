// CineSync Mobile — Media Detector Utility
// Нормализация URL в RoomMedia + JS injection для WebView

import type { VideoPlatform } from '@components/video/UniversalPlayer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomMedia {
  videoUrl: string;
  videoTitle: string;
  videoPlatform: VideoPlatform;
  videoThumbnail?: string;
}

/** Payload приходящий через WebView postMessage */
export interface MediaDetectedPayload {
  type: 'MEDIA_DETECTED';
  platform: 'youtube' | 'direct';
  videoUrl: string;
  pageTitle: string;
  thumbnailUrl?: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

/** Преобразует raw detection payload в RoomMedia */
export function normalizeDetectedMedia(payload: MediaDetectedPayload): RoomMedia {
  const platform: VideoPlatform =
    payload.platform === 'youtube'
      ? 'youtube'
      : /\.(mp4|m3u8|webm)(\?.*)?$/i.test(payload.videoUrl)
      ? 'direct'
      : 'webview';

  return {
    videoUrl: payload.videoUrl,
    videoTitle: payload.pageTitle || 'Video',
    videoPlatform: platform,
    videoThumbnail: payload.thumbnailUrl,
  };
}

// ─── JS Injection ─────────────────────────────────────────────────────────────

/**
 * JavaScript инъекция для WebView.
 * Определяет YouTube видео страницы и HTML5 video элементы.
 * Отправляет MEDIA_DETECTED через postMessage.
 *
 * Логика:
 * 1. После загрузки страницы → проверяет URL на YouTube паттерны
 * 2. Ищет <video> элементы с src
 * 3. Следит за SPA навигацией (pushState/popstate)
 * 4. Повторно не сообщает один и тот же URL
 */
export const MEDIA_DETECTION_JS = `
(function() {
  var lastReportedUrl = '';
  var timer = null;

  // Search engine result pages — no real video, skip detection
  var SEARCH_PATTERNS = [
    'google.com/search',
    'bing.com/search',
    'yandex.ru/search',
    'yandex.com/search',
    'yahoo.com/search',
    'duckduckgo.com/?q=',
    'mail.ru/search',
  ];

  function isSearchPage(url) {
    for (var i = 0; i < SEARCH_PATTERNS.length; i++) {
      if (url.indexOf(SEARCH_PATTERNS[i]) !== -1) return true;
    }
    return false;
  }

  // Only consider video src that looks like a real media file or stream
  function isRealVideoSrc(src) {
    if (!src || src.indexOf('http') !== 0) return false;
    // Skip blob URLs (DRM), data URLs, about:, chrome-extension:
    if (src.indexOf('blob:') === 0 || src.indexOf('data:') === 0) return false;
    // Must be a real URL
    var lower = src.toLowerCase();
    // Accept direct media file extensions
    if (/\\.(mp4|m3u8|webm|ogg|mov|ts|mkv)(\\?|$)/.test(lower)) return true;
    // Accept known video CDN patterns
    if (lower.indexOf('videoplayback') !== -1) return false; // Google CDN previews — skip
    if (lower.indexOf('.googlevideo.com') !== -1) return false; // Google video CDN — skip
    if (lower.indexOf('googlevideo') !== -1) return false;
    // Accept if it's a stream endpoint (contains /stream, /playlist, /manifest, /hls)
    if (/\\/(stream|playlist\\.m3u8|manifest|hls|dash)/.test(lower)) return true;
    // Reject everything else (thumbnails, posters, API endpoints)
    return false;
  }

  function detectMedia() {
    var url = window.location.href;

    // Skip search engine result pages — they have preview video clips, not real content
    if (isSearchPage(url)) return;

    var isYTWatch = url.indexOf('youtube.com/watch?') !== -1;
    var isYTShorts = url.indexOf('youtube.com/shorts/') !== -1;
    var isYTBe = url.indexOf('youtu.be/') !== -1;

    if ((isYTWatch || isYTShorts || isYTBe) && url !== lastReportedUrl) {
      lastReportedUrl = url;
      var thumb = '';
      var vidMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      var shortMatch = url.match(/shorts\\/([a-zA-Z0-9_-]{11})/);
      var beMatch = url.match(/youtu\\.be\\/([a-zA-Z0-9_-]{11})/);
      var vid = (vidMatch && vidMatch[1]) || (shortMatch && shortMatch[1]) || (beMatch && beMatch[1]);
      if (vid) thumb = 'https://img.youtube.com/vi/' + vid + '/hqdefault.jpg';
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'MEDIA_DETECTED',
        platform: 'youtube',
        videoUrl: url,
        pageTitle: document.title || 'YouTube',
        thumbnailUrl: thumb,
      }));
      return;
    }

    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      var src = v.src || v.currentSrc;
      if (!src) {
        var s = v.querySelector('source');
        if (s) src = s.src || s.getAttribute('src') || '';
      }
      if (isRealVideoSrc(src) && url !== lastReportedUrl) {
        lastReportedUrl = url;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MEDIA_DETECTED',
          platform: 'direct',
          videoUrl: src,
          pageTitle: document.title || 'Video',
        }));
        return;
      }
    }
  }

  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(detectMedia, ms);
  }

  schedule(1500);
  window.addEventListener('load', function() { schedule(2000); });

  var ph = history.pushState.bind(history);
  var rh = history.replaceState.bind(history);
  history.pushState = function() {
    ph.apply(history, arguments);
    lastReportedUrl = '';
    schedule(1500);
  };
  history.replaceState = function() {
    rh.apply(history, arguments);
    lastReportedUrl = '';
    schedule(1500);
  };
  window.addEventListener('popstate', function() {
    lastReportedUrl = '';
    schedule(1500);
  });

  true;
})();
`;
