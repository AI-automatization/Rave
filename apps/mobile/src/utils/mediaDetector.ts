// CineSync Mobile — Media Detector Utility
// Нормализация URL в RoomMedia + JS injection для WebView

import type { VideoPlatform } from '@components/video/UniversalPlayer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomMedia {
  videoUrl: string;
  videoTitle: string;
  videoPlatform: VideoPlatform;
  videoThumbnail?: string;
  /** Referer URL для CDN hotlink-защиты */
  videoReferer?: string;
  /** webview-session mode — DRM/auth сайтлар */
  mode?: 'extracted' | 'webview-session';
}

/** Payload приходящий через WebView postMessage */
export interface MediaDetectedPayload {
  type: 'MEDIA_DETECTED';
  platform: 'youtube' | 'direct';
  videoUrl: string;
  pageTitle: string;
  thumbnailUrl?: string;
  /** URL страницы где найдено видео — нужен как Referer для CDN */
  pageUrl?: string;
  /** E65-1: webview-session режими — DRM/auth сайтлар */
  mode?: 'extracted' | 'webview-session';
}

/** blob: URL топилганда — DRM/auth сайт сигнали (webview-session режими) */
export interface BlobVideoFoundPayload {
  type: 'BLOB_VIDEO_FOUND';
  pageUrl: string;
  pageTitle: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

/** Преобразует raw detection payload в RoomMedia */
export function normalizeDetectedMedia(payload: MediaDetectedPayload): RoomMedia {
  const platform: VideoPlatform =
    payload.platform === 'youtube'
      ? 'youtube'
      : /\.(mp4|m3u8|webm|mpd)(\?.*)?$/i.test(payload.videoUrl)
      ? 'direct'
      : 'webview';

  return {
    videoUrl: payload.videoUrl,
    videoTitle: payload.pageTitle || 'Video',
    videoPlatform: platform,
    videoThumbnail: payload.thumbnailUrl,
    videoReferer: payload.pageUrl,
    mode: payload.mode ?? 'extracted',
  };
}

/** blob: topilganda webview-session RoomMedia qaytaradi */
export function normalizeBlobMedia(payload: BlobVideoFoundPayload): RoomMedia {
  return {
    videoUrl: payload.pageUrl,
    videoTitle: payload.pageTitle || 'Video',
    videoPlatform: 'webview',
    videoReferer: payload.pageUrl,
    mode: 'webview-session',
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
  if (window._csMediaDetectorSetup) return;
  window._csMediaDetectorSetup = true;

  var lastReportedVideoUrl = '';
  var fallbackTimer = null;

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

  function rn(obj) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  // Only consider video src that looks like a real media file or stream
  function isRealVideoSrc(src) {
    if (!src || src.indexOf('http') !== 0) return false;
    if (src.indexOf('data:') === 0) return false;
    var lower = src.toLowerCase();
    // E64-4: добавлен .mpd (DASH)
    if (/\\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\\?|$)/.test(lower)) return true;
    if (lower.indexOf('videoplayback') !== -1) return false;
    if (lower.indexOf('.googlevideo.com') !== -1) return false;
    if (lower.indexOf('googlevideo') !== -1) return false;
    if (/\\/(stream|playlist\\.m3u8|manifest|hls|dash)/.test(lower)) return true;
    // T-E070: Facebook, Instagram, Reddit, Streamable CDN domenlar
    if (lower.indexOf('fbcdn.net') !== -1 && lower.indexOf('.mp4') !== -1) return true;
    if (lower.indexOf('cdninstagram.com') !== -1 && lower.indexOf('.mp4') !== -1) return true;
    if (lower.indexOf('v.redd.it') !== -1) return true;
    if (lower.indexOf('streamable.com') !== -1 && lower.indexOf('.mp4') !== -1) return true;
    return false;
  }

  // E64-5: blob: URL → BLOB_VIDEO_FOUND (webview-session signal)
  function reportBlobVideo() {
    if ('blob:' + window.location.href === lastReportedVideoUrl) return;
    lastReportedVideoUrl = 'blob:' + window.location.href;
    rn({
      type: 'BLOB_VIDEO_FOUND',
      pageUrl: window.location.href,
      pageTitle: document.title || 'Video',
    });
  }

  function reportVideoUrl(src) {
    if (src === lastReportedVideoUrl) return;
    lastReportedVideoUrl = src;
    rn({
      type: 'MEDIA_DETECTED',
      platform: 'direct',
      videoUrl: src,
      pageTitle: document.title || 'Video',
      pageUrl: window.location.href,
    });
  }

  function scanVideos() {
    var url = window.location.href;
    if (isSearchPage(url)) return false;

    // YouTube detection
    var isYTWatch = url.indexOf('youtube.com/watch?') !== -1;
    var isYTShorts = url.indexOf('youtube.com/shorts/') !== -1;
    var isYTBe = url.indexOf('youtu.be/') !== -1;
    if (isYTWatch || isYTShorts || isYTBe) {
      if (url !== lastReportedVideoUrl) {
        lastReportedVideoUrl = url;
        var thumb = '';
        var vidMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        var shortMatch = url.match(/shorts\\/([a-zA-Z0-9_-]{11})/);
        var beMatch = url.match(/youtu\\.be\\/([a-zA-Z0-9_-]{11})/);
        var vid = (vidMatch && vidMatch[1]) || (shortMatch && shortMatch[1]) || (beMatch && beMatch[1]);
        if (vid) thumb = 'https://img.youtube.com/vi/' + vid + '/hqdefault.jpg';
        rn({
          type: 'MEDIA_DETECTED',
          platform: 'youtube',
          videoUrl: url,
          pageTitle: document.title || 'YouTube',
          thumbnailUrl: thumb,
          pageUrl: url,
        });
      }
      return true;
    }

    // HTML5 video scan
    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      var src = v.src || v.currentSrc;
      if (!src) {
        var s = v.querySelector('source');
        if (s) src = s.src || s.getAttribute('src') || '';
      }
      // E64-5: blob → BLOB_VIDEO_FOUND
      if (src && src.indexOf('blob:') === 0) {
        reportBlobVideo();
        return true;
      }
      if (isRealVideoSrc(src)) {
        reportVideoUrl(src);
        return true;
      }
    }
    return false;
  }

  // E64-1: MutationObserver — detect new <video> added to DOM immediately
  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeName === 'VIDEO' || (node.querySelectorAll && node.querySelectorAll('video').length > 0)) {
          scanVideos();
          return;
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // E64-2: HTMLMediaElement.src setter intercept
  try {
    var origDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (origDescriptor && origDescriptor.set) {
      Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        set: function(val) {
          origDescriptor.set.call(this, val);
          if (!val) return;
          if (val.indexOf('blob:') === 0) {
            reportBlobVideo();
          } else if (isRealVideoSrc(val)) {
            reportVideoUrl(val);
          }
        },
        get: origDescriptor.get,
        configurable: true,
      });
    }
  } catch(e) {}

  // E64-6: Timeout fallback — 5s, then retry once after 500ms
  function startFallbackTimer() {
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(function() {
      var found = scanVideos();
      if (!found) {
        setTimeout(scanVideos, 500);
      }
    }, 5000);
  }

  // Initial scan
  scanVideos();
  startFallbackTimer();
  window.addEventListener('load', function() { scanVideos(); startFallbackTimer(); });

  // SPA navigation tracking — E64-3: reset lastReportedVideoUrl (video URL, not page URL)
  var ph = history.pushState.bind(history);
  var rh = history.replaceState.bind(history);
  history.pushState = function() {
    ph.apply(history, arguments);
    lastReportedVideoUrl = '';
    scanVideos();
    startFallbackTimer();
  };
  history.replaceState = function() {
    rh.apply(history, arguments);
    lastReportedVideoUrl = '';
    scanVideos();
    startFallbackTimer();
  };
  window.addEventListener('popstate', function() {
    lastReportedVideoUrl = '';
    scanVideos();
    startFallbackTimer();
  });

  true;
})();
`;
