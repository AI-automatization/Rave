// CineSync Mobile — WebViewAdapters
// Saytga moslashgan video element topish strategiyalari
// M7: uzmovi.tv, kinogo.cc va generic fallback

export interface VideoAdapter {
  /** CSS selectors — tartib muhim, birinchi topilgani ishlatiladi */
  selectors: string[];
  /** Video topilgandan keyin ishga tushadigan JS (popup yopish va h.k.) */
  postAttachJs?: string;
  /** Birinchi scan uchun kutish ms — lazy-loading player lar uchun */
  scanDelay: number;
}

// Saytga xos adapterlar
const ADAPTERS: Record<string, VideoAdapter> = {
  'youtube.com': {
    selectors: [
      '.html5-main-video',
      '.video-stream',
      'video',
    ],
    postAttachJs: `
      // YouTube reklama va popup larni yopish
      var skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, [id*="skip"]');
      if (skipBtn) skipBtn.click();
      // Autoplay
      if (window._csVideo && window._csVideo.paused) {
        window._csVideo.play().catch(function(){});
      }
    `,
    scanDelay: 3000,
  },

  'm.youtube.com': {
    selectors: [
      '.html5-main-video',
      '.video-stream',
      'video',
    ],
    postAttachJs: `
      var skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, [id*="skip"]');
      if (skipBtn) skipBtn.click();
      if (window._csVideo && window._csVideo.paused) {
        window._csVideo.play().catch(function(){});
      }
    `,
    scanDelay: 3000,
  },

  'uzmovi.tv': {
    selectors: [
      '.plyr video',
      '#player video',
      '.video-wrapper video',
      '.jwplayer video',
      'video',
    ],
    postAttachJs: `
      var ov = document.querySelector('.modal-overlay, .popup-close, .close-btn, [data-dismiss]');
      if (ov) ov.click();
    `,
    scanDelay: 2000,
  },

  'kinogo.cc': {
    selectors: [
      '#oframep video',
      '.player-box video',
      '.player video',
      '.video-js video',
      'video',
    ],
    postAttachJs: `
      var pop = document.querySelector('.popup__close, .modal__close, [data-close]');
      if (pop) pop.click();
    `,
    scanDelay: 1500,
  },

  'filmix.net': {
    selectors: [
      '.vjs-tech',
      '.video-js video',
      '#player video',
      'video',
    ],
    scanDelay: 1000,
  },

  'hdrezka.ag': {
    selectors: [
      '#player video',
      '.pjsplayer video',
      'video',
    ],
    scanDelay: 2500,
  },
};

const GENERIC_ADAPTER: VideoAdapter = {
  selectors: ['video'],
  scanDelay: 0,
};

export function getAdapter(url: string): VideoAdapter {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return ADAPTERS[hostname] ?? GENERIC_ADAPTER;
  } catch {
    return GENERIC_ADAPTER;
  }
}

/**
 * Adapter asosida WebView ichiga inject qilinadigan JS ni qaytaradi.
 * - Adapter selectors tartibida <video> qidiradi
 * - play/pause/seeked eventlarini RN ga yuboradi
 * - Har 2 sekundda progress yuboradi
 * - Nested iframe aniqlansa URL larini yuboradi
 */
export function buildInjectJs(adapter: VideoAdapter): string {
  const selectorsJson = JSON.stringify(adapter.selectors);
  const postAttach = adapter.postAttachJs ?? '';
  const scanDelay = adapter.scanDelay;

  return `
(function() {
  if (window._csVideoSetup) return;
  window._csVideoSetup = true;

  var SELECTORS = ${selectorsJson};

  function rn(obj) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  function attachVideo(v) {
    if (window._csVideo === v) return;
    window._csVideo = v;

    v.addEventListener('play', function() {
      rn({ type: 'PLAY', currentTime: v.currentTime });
    });
    v.addEventListener('pause', function() {
      rn({ type: 'PAUSE', currentTime: v.currentTime });
    });
    v.addEventListener('seeked', function() {
      rn({ type: 'SEEK', currentTime: v.currentTime });
    });

    if (window._csProgressInterval) clearInterval(window._csProgressInterval);
    window._csProgressInterval = setInterval(function() {
      if (window._csVideo && !window._csVideo.paused) {
        rn({ type: 'PROGRESS', currentTime: window._csVideo.currentTime, duration: window._csVideo.duration || 0 });
      }
    }, 2000);

    ${postAttach}
    rn({ type: 'VIDEO_FOUND' });
  }

  function scan() {
    for (var i = 0; i < SELECTORS.length; i++) {
      var v = document.querySelector(SELECTORS[i]);
      if (v) { attachVideo(v); return; }
    }

    var iframes = document.querySelectorAll('iframe');
    var urls = [];
    for (var j = 0; j < iframes.length; j++) {
      if (iframes[j].src && iframes[j].src.indexOf('http') === 0) {
        urls.push(iframes[j].src);
      }
    }
    if (urls.length) rn({ type: 'IFRAME_FOUND', urls: urls });
  }

  var obs = new MutationObserver(scan);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  if (${scanDelay} > 0) {
    setTimeout(scan, ${scanDelay});
  } else {
    scan();
  }
  setTimeout(scan, 1500);
  setTimeout(scan, 4000);
})();
true;
`;
}
