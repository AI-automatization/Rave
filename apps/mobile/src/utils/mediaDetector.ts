// WeWatch Mobile — Media Detector Utility
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
  // Trust the JS-side platform flag: isRealVideoSrc() already validated the URL via
  // extension check + CDN path patterns. Re-checking only extension here would downgrade
  // extensionless CDN HLS streams (e.g. /hls/stream, /video/abc/index) to 'webview'.
  const platform: VideoPlatform =
    payload.platform === 'youtube' ? 'youtube' : 'direct';

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

  // Sync with early-injection script (injectedJavaScriptBeforeContentLoaded) so
  // URLs detected before page JS ran don't get reported a second time.
  var lastReportedVideoUrl = window._csEarlyReportedUrl || '';
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
    // Static assets are never video — must run BEFORE path checks below, otherwise a
    // player SDK like .../player_sdk/hls/1.4.3/hls.min.js matches the /hls/ path rule.
    if (/\\.(js|mjs|css|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|wasm|html?|map|txt|xml)(\\?|#|$)/.test(lower)) return false;
    // E64-4: file extension matching (.mpd = MPEG-DASH)
    if (/\\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\\?|$)/.test(lower)) return true;
    // Explicitly skip Google video CDN (YouTube internal playback URLs)
    if (lower.indexOf('videoplayback') !== -1) return false;
    if (lower.indexOf('.googlevideo.com') !== -1) return false;
    if (lower.indexOf('googlevideo') !== -1) return false;
    // Common stream path segments
    if (/\\/(stream|playlist\\.m3u8|manifest\\.m3u8|master\\.m3u8|manifest|hls|dash|chunklist)/.test(lower)) return true;
    // E64-9: CIS CDN patterns — uzmovi.uz, mover.uz, kinopub, etc. use CDN URLs without extensions
    // e.g. https://cdn.uzmovie.tv/v/abc/index or https://hls2.cdn.ru/video/720p/seg
    if (/\\/(video|vod|cdn|media)\\/[^/]+\\/(index|master|720p|480p|360p|1080p|hls)/.test(lower)) return true;
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

    // Performance entries scan — catches HLS.js m3u8 fetches that happened before our
    // XHR intercept was installed (Android evaluateJavascript race) OR after async player init.
    // Including this in scanVideos() means the fallback timer ALSO retries it.
    try {
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        var perfEntries = performance.getEntriesByType('resource');
        for (var pi = 0; pi < perfEntries.length; pi++) {
          if (isRealVideoSrc(perfEntries[pi].name)) {
            reportVideoUrl(perfEntries[pi].name);
            return true;
          }
        }
      }
    } catch(e) {}

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

  // E64-2/7/8/9: These intercepts run in injectedJavaScriptBeforeContentLoaded (MEDIA_INTERCEPT_EARLY_JS)
  // on Android so they catch player library requests before page JS fires.
  // Skip re-registering them here if the early script already set them up.
  if (!window._csMediaInterceptSetup) {
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

    document.addEventListener('play', function(e) {
      var target = e.target;
      if (!target || target.tagName !== 'VIDEO') return;
      var src = target.currentSrc || target.src;
      if (!src) return;
      if (src.indexOf('blob:') === 0) {
        reportBlobVideo();
      } else if (isRealVideoSrc(src)) {
        reportVideoUrl(src);
      }
    }, true);

    try {
      var origXhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, xhrUrl) {
        if (typeof xhrUrl === 'string' && isRealVideoSrc(xhrUrl)) {
          reportVideoUrl(xhrUrl);
        }
        return origXhrOpen.apply(this, arguments);
      };
    } catch(e) {}

    try {
      var origFetch = window.fetch;
      if (typeof origFetch === 'function') {
        window.fetch = function(input, init) {
          var url = typeof input === 'string' ? input
            : (input && typeof input === 'object' && 'url' in input ? input.url : '');
          if (url && isRealVideoSrc(url)) {
            reportVideoUrl(url);
          }
          return origFetch.apply(this, arguments);
        };
      }
    } catch(e) {}
  }

  // E64-6: Multi-stage fallback — HLS.js typically inits 1-3s after page load.
  // Scanning at 1s and 3s catches it before the user taps import (usually at 2-4s).
  // 5s scan is the safety net; 7s retry handles slow CDNs and lazy-init players.
  function startFallbackTimer() {
    clearTimeout(fallbackTimer);
    setTimeout(scanVideos, 1000);
    setTimeout(scanVideos, 3000);
    fallbackTimer = setTimeout(function() {
      var found = scanVideos();
      if (!found) {
        setTimeout(scanVideos, 2000);
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
    window._csEarlyReportedUrl = '';
    scanVideos();
    startFallbackTimer();
  };
  history.replaceState = function() {
    rh.apply(history, arguments);
    lastReportedVideoUrl = '';
    window._csEarlyReportedUrl = '';
    scanVideos();
    startFallbackTimer();
  };
  window.addEventListener('popstate', function() {
    lastReportedVideoUrl = '';
    window._csEarlyReportedUrl = '';
    scanVideos();
    startFallbackTimer();
  });

  // Synchronous scan of already-fetched resources — works on all Android WebView (Chrome 25+).
  // Catches m3u8/mp4 URLs that HLS.js fetched BEFORE our XHR intercept was installed,
  // which happens when Android's evaluateJavascript queues the early script too late.
  // Must run BEFORE PerformanceObserver so deduplication (lastReportedVideoUrl) works correctly.
  try {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      var perfEntries = performance.getEntriesByType('resource');
      for (var pi = 0; pi < perfEntries.length; pi++) {
        if (isRealVideoSrc(perfEntries[pi].name)) {
          reportVideoUrl(perfEntries[pi].name);
          break;
        }
      }
    }
  } catch(e) {}

  // PerformanceObserver: forward-looking — catches m3u8/mp4 URLs from HLS.js that loads
  // AFTER page load event (async/lazy scripts). Complements the sync scan above.
  // Uses buffered:true (Chrome 73+) with graceful fallback to entryTypes for older WebView.
  try {
    if (typeof PerformanceObserver !== 'undefined') {
      var perfObs = new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        for (var ei = 0; ei < entries.length; ei++) {
          if (isRealVideoSrc(entries[ei].name)) {
            reportVideoUrl(entries[ei].name);
            return;
          }
        }
      });
      try {
        perfObs.observe({ type: 'resource', buffered: true });
      } catch(e) {
        perfObs.observe({ entryTypes: ['resource'] });
      }
    }
  } catch(e) {}

  true;
})();
`;

/**
 * Early-injection script for injectedJavaScriptBeforeContentLoaded.
 * Runs before any page JavaScript on Android so XHR/fetch intercepts catch
 * HLS.js / Playerjs manifest requests before the player library fires them.
 * Sets window._csMediaInterceptSetup = true so MEDIA_DETECTION_JS skips
 * re-registering the same intercepts.
 */
export const MEDIA_INTERCEPT_EARLY_JS = `
(function() {
  if (window._csMediaInterceptSetup) return true;
  window._csMediaInterceptSetup = true;
  window._csEarlyReportedUrl = '';

  function rn(obj) {
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
  }

  function isRealVideoSrc(src) {
    if (!src || src.indexOf('http') !== 0) return false;
    if (src.indexOf('data:') === 0) return false;
    var lower = src.toLowerCase();
    if (/\\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\\?|$)/.test(lower)) return true;
    if (lower.indexOf('videoplayback') !== -1) return false;
    if (lower.indexOf('.googlevideo.com') !== -1) return false;
    if (lower.indexOf('googlevideo') !== -1) return false;
    if (/\\/(stream|playlist\\.m3u8|manifest\\.m3u8|master\\.m3u8|manifest|hls|dash|chunklist)/.test(lower)) return true;
    if (/\\/(video|vod|cdn|media)\\/[^/]+\\/(index|master|720p|480p|360p|1080p|hls)/.test(lower)) return true;
    if (lower.indexOf('fbcdn.net') !== -1 && lower.indexOf('.mp4') !== -1) return true;
    if (lower.indexOf('cdninstagram.com') !== -1 && lower.indexOf('.mp4') !== -1) return true;
    if (lower.indexOf('v.redd.it') !== -1) return true;
    if (lower.indexOf('streamable.com') !== -1 && lower.indexOf('.mp4') !== -1) return true;
    return false;
  }

  function reportBlobVideo() {
    var key = 'blob:' + window.location.href;
    if (key === window._csEarlyReportedUrl) return;
    window._csEarlyReportedUrl = key;
    rn({ type: 'BLOB_VIDEO_FOUND', pageUrl: window.location.href, pageTitle: document.title || 'Video' });
  }

  function reportVideoUrl(src) {
    if (src === window._csEarlyReportedUrl) return;
    window._csEarlyReportedUrl = src;
    rn({ type: 'MEDIA_DETECTED', platform: 'direct', videoUrl: src, pageTitle: document.title || 'Video', pageUrl: window.location.href });
  }

  // HTMLMediaElement.src setter — catches player libs calling video.src = url
  try {
    var origDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (origDescriptor && origDescriptor.set) {
      Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        set: function(val) {
          origDescriptor.set.call(this, val);
          if (!val) return;
          if (val.indexOf('blob:') === 0) { reportBlobVideo(); }
          else if (isRealVideoSrc(val)) { reportVideoUrl(val); }
        },
        get: origDescriptor.get,
        configurable: true,
      });
    }
  } catch(e) {}

  // play event capture — currentSrc is guaranteed set when play fires
  document.addEventListener('play', function(e) {
    var target = e.target;
    if (!target || target.tagName !== 'VIDEO') return;
    var src = target.currentSrc || target.src;
    if (!src) return;
    if (src.indexOf('blob:') === 0) { reportBlobVideo(); }
    else if (isRealVideoSrc(src)) { reportVideoUrl(src); }
  }, true);

  // XHR intercept — HLS.js / Playerjs fetch manifest via XHR
  try {
    var origXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, xhrUrl) {
      if (typeof xhrUrl === 'string' && isRealVideoSrc(xhrUrl)) { reportVideoUrl(xhrUrl); }
      return origXhrOpen.apply(this, arguments);
    };
  } catch(e) {}

  // fetch intercept — HLS.js v1+ uses fetch for HLS manifests
  try {
    var origFetch = window.fetch;
    if (typeof origFetch === 'function') {
      window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input
          : (input && typeof input === 'object' && 'url' in input ? input.url : '');
        if (url && isRealVideoSrc(url)) { reportVideoUrl(url); }
        return origFetch.apply(this, arguments);
      };
    }
  } catch(e) {}

  true;
})();
`;
