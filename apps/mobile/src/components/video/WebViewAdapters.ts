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

  // filmx.fun — same player infrastructure as filmix.net
  'filmx.fun': {
    selectors: [
      '.vjs-tech',
      '.video-js video',
      '#player video',
      'video',
    ],
    scanDelay: 1500,
  },

  'hdrezka.ag': {
    selectors: [
      '#player video',
      '.pjsplayer video',
      'video',
    ],
    scanDelay: 2500,
  },

  // rezka.ag — HDrezka new domain (hdrezka.ag → rezka.ag migration)
  'rezka.ag': {
    selectors: [
      '#player video',
      '.pjsplayer video',
      'video',
    ],
    scanDelay: 2500,
  },

  // T-E069: ashdi.vip + bazon.tv — 60-70% CIS saytlari shular orqali ishlaydi
  'ashdi.vip': {
    selectors: ['.jw-video', '.plyr video', '.video-js video', 'video'],
    postAttachJs: `
      // Playerjs JSON file list dan birinchi URL ni olish
      try {
        var pjScripts = document.querySelectorAll('script');
        for (var i = 0; i < pjScripts.length; i++) {
          var t = pjScripts[i].textContent || '';
          var m = t.match(/Playerjs\\s*\\(\\s*\\{[^}]*file\\s*:\\s*"([^"]+)"/);
          if (!m) m = t.match(/file\\s*:\\s*"([^"]+\\.(?:m3u8|mp4)[^"]*)"/);
          if (m && m[1] && window._csVideo) { window._csVideo.src = m[1]; break; }
        }
      } catch(e) {}
    `,
    scanDelay: 2500,
  },

  'bazon.tv': {
    selectors: ['.video-js video', '.vjs-tech', '.plyr video', 'video'],
    postAttachJs: `
      var ad = document.querySelector('.close-btn, .popup-close, [data-dismiss="modal"]');
      if (ad) ad.click();
    `,
    scanDelay: 2000,
  },

  // T-E069: Keng tarqalgan CDN providerlar
  'cdnvideohub.xyz': {
    selectors: ['.jw-video', '.video-js video', 'video'],
    scanDelay: 2000,
  },

  'videocdn.me': {
    selectors: ['.jw-video', '.plyr video', '.video-js video', 'video'],
    scanDelay: 2000,
  },

  // E65-7: webview-session платформалар
  'cinerama.uz': {
    selectors: ['.video-js video', '.plyr video', 'video'],
    postAttachJs: `
      var playBtn = document.querySelector('.vjs-play-control, .plyr__control--overlaid, [data-plyr="play"]');
      if (playBtn) playBtn.click();
    `,
    scanDelay: 2000,
  },

  'megogo.net': {
    selectors: ['.vjs-tech', 'video.megogo-player', 'video'],
    postAttachJs: `
      var ad = document.querySelector('.megogo-ad-skip, .skip-btn');
      if (ad) ad.click();
    `,
    scanDelay: 3000,
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

// ─── T-E066: Embed platform ID extractors ────────────────────────────────────

/** Twitch URL dan channel yoki VOD ID ni ajratib oladi */
export function extractTwitchId(url: string): { type: 'channel' | 'vod'; id: string } | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host === 'clips.twitch.tv') {
      const slug = pathname.replace(/^\//, '').split('/')[0];
      if (slug) return { type: 'vod', id: slug };
    }
    if (host === 'twitch.tv') {
      const vodMatch = pathname.match(/^\/videos\/(\d+)/);
      if (vodMatch) return { type: 'vod', id: vodMatch[1] };
      const channel = pathname.replace(/^\//, '').split('/')[0];
      if (channel && channel !== 'videos') return { type: 'channel', id: channel };
    }
  } catch { /* invalid URL */ }
  return null;
}

/** VK Video URL dan ownerId + videoId ni ajratib oladi */
export function extractVKVideoIds(url: string): { ownerId: string; videoId: string } | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'vk.com' && host !== 'vkvideo.ru') return null;
    const rawId =
      searchParams.get('z')?.replace(/^video/, '') ??
      pathname.match(/\/video(-?\d+_\d+)/)?.[1] ??
      null;
    if (rawId) {
      const parts = rawId.split('_');
      if (parts.length === 2) return { ownerId: parts[0], videoId: parts[1] };
    }
  } catch { /* invalid URL */ }
  return null;
}

/** Rutube URL dan video ID ni ajratib oladi */
export function extractRutubeId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'rutube.ru') return null;
    const match = pathname.match(/\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch { return null; }
}

/** Vimeo URL dan video ID ni ajratib oladi */
export function extractVimeoId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
    const match = pathname.match(/\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  } catch { return null; }
}

/** Dailymotion URL dan video ID ni ajratib oladi */
export function extractDailymotionId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (!host.includes('dailymotion.com') && host !== 'dai.ly') return null;
    const match = pathname.match(/\/(?:video\/|embed\/video\/)?([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch { return null; }
}

// ─── T-E066: Embed HTML page builders ────────────────────────────────────────

const BASE_HTML_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
`;

const RN_BRIDGE = `
  function rn(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }
`;

/** Twitch embed — live channels and VODs */
export function buildTwitchHtml(id: string, type: 'channel' | 'vod'): string {
  const embedOpts = type === 'channel'
    ? `channel: "${id}", parent: ["localhost"]`
    : `video: "${id}", parent: ["localhost"]`;
  return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${BASE_HTML_STYLES} #twitch-embed, #twitch-embed iframe { width: 100% !important; height: 100% !important; }</style>
</head><body>
  <div id="twitch-embed"></div>
  <script src="https://embed.twitch.tv/embed/v1.js"></script>
  <script>
    ${RN_BRIDGE}
    var progressTimer = null;
    window.addEventListener('load', function() {
      var embed = new Twitch.Embed('twitch-embed', {
        width: '100%', height: '100%', ${embedOpts},
        autoplay: true, muted: false, layout: 'video'
      });
      embed.addEventListener(Twitch.Embed.VIDEO_READY, function() {
        var p = embed.getPlayer();
        window._csVideo = {
          get currentTime() { try { return p.getPosition ? p.getPosition() : 0; } catch(e) { return 0; } },
          set currentTime(t) { try { if (p.seek) { p.seek(t); rn({ type: 'SEEK', currentTime: t }); } } catch(e) {} },
          play: function() { try { p.play(); } catch(e) {} },
          pause: function() { try { p.pause(); } catch(e) {} },
          get paused() { try { return p.isPaused ? p.isPaused() : true; } catch(e) { return true; } }
        };
        rn({ type: 'VIDEO_FOUND' });
        progressTimer = setInterval(function() {
          rn({ type: 'PROGRESS', currentTime: window._csVideo.currentTime, duration: 0 });
        }, 2000);
      });
      embed.addEventListener(Twitch.Embed.VIDEO_PLAY, function() {
        rn({ type: 'PLAY', currentTime: window._csVideo ? window._csVideo.currentTime : 0 });
      });
      embed.addEventListener(Twitch.Embed.VIDEO_PAUSE, function() {
        rn({ type: 'PAUSE', currentTime: window._csVideo ? window._csVideo.currentTime : 0 });
      });
    });
  </script>
</body></html>`;
}

/** VK Video embed */
export function buildVKVideoHtml(ownerId: string, videoId: string): string {
  return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${BASE_HTML_STYLES} iframe { width: 100%; height: 100%; border: none; display: block; }</style>
</head><body>
  <iframe id="vk-player"
    src="https://vk.com/video_ext.php?oid=${ownerId}&id=${videoId}&hd=1&autoplay=1"
    allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
  <script>
    ${RN_BRIDGE}
    var ct = 0, dur = 0, paused = true, progressTimer = null;
    window._csVideo = {
      get currentTime() { return ct; },
      set currentTime(t) {
        ct = t;
        var f = document.getElementById('vk-player');
        if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ method: 'seek', value: t }), '*');
        rn({ type: 'SEEK', currentTime: t });
      },
      play: function() {
        var f = document.getElementById('vk-player');
        if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
      },
      pause: function() {
        var f = document.getElementById('vk-player');
        if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
      },
      get paused() { return paused; }
    };
    function startProgress() {
      if (progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(function() {
        if (!paused) rn({ type: 'PROGRESS', currentTime: ct, duration: dur });
      }, 2000);
    }
    window.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        var evt = data.type || data.event || '';
        var p = data.params || data;
        switch (evt) {
          case 'inited': case 'ready': rn({ type: 'VIDEO_FOUND' }); startProgress(); break;
          case 'started': case 'resume': case 'play': paused = false; ct = p.position || ct; rn({ type: 'PLAY', currentTime: ct }); break;
          case 'paused': case 'pause': paused = true; ct = p.position || ct; rn({ type: 'PAUSE', currentTime: ct }); break;
          case 'seek': case 'seeked': ct = p.position || ct; rn({ type: 'SEEK', currentTime: ct }); break;
          case 'time': case 'timeupdate': ct = p.position || ct; dur = p.duration || dur; break;
        }
      } catch(e) {}
    });
  </script>
</body></html>`;
}

/** Rutube embed */
export function buildRutubeHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${BASE_HTML_STYLES} iframe { width: 100%; height: 100%; border: none; display: block; }</style>
</head><body>
  <iframe id="rutube-player"
    src="https://rutube.ru/play/embed/${videoId}?autoplay=1"
    allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
  <script>
    ${RN_BRIDGE}
    var ct = 0, dur = 0, paused = true, progressTimer = null;
    function sendCmd(method, value) {
      var f = document.getElementById('rutube-player');
      if (f && f.contentWindow) {
        var msg = { method: method };
        if (value !== undefined) msg.value = value;
        f.contentWindow.postMessage(JSON.stringify(msg), '*');
      }
    }
    window._csVideo = {
      get currentTime() { return ct; },
      set currentTime(t) { ct = t; sendCmd('setCurrentTime', t); rn({ type: 'SEEK', currentTime: t }); },
      play: function() { sendCmd('play'); },
      pause: function() { sendCmd('pause'); },
      get paused() { return paused; }
    };
    function startProgress() {
      if (progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(function() {
        if (!paused) rn({ type: 'PROGRESS', currentTime: ct, duration: dur });
      }, 2000);
    }
    window.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        var d = data.data || {};
        switch (data.type) {
          case 'player:ready': rn({ type: 'VIDEO_FOUND' }); startProgress(); break;
          case 'player:changeState':
            if (d.state === 'playing') { paused = false; rn({ type: 'PLAY', currentTime: ct }); }
            else if (d.state === 'paused' || d.state === 'stopped') { paused = true; rn({ type: 'PAUSE', currentTime: ct }); }
            break;
          case 'player:currentTime':
            ct = d.time || ct;
            dur = d.duration || dur;
            break;
        }
      } catch(e) {}
    });
  </script>
</body></html>`;
}

/** Vimeo embed using Player.js SDK */
export function buildVimeoHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${BASE_HTML_STYLES} #vimeo-container, #vimeo-container iframe { width: 100% !important; height: 100% !important; border: none; }</style>
</head><body>
  <div id="vimeo-container">
    <iframe id="vimeo-player"
      src="https://player.vimeo.com/video/${videoId}?autoplay=1&playsinline=1&transparent=0"
      allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
  </div>
  <script src="https://player.vimeo.com/api/player.js"></script>
  <script>
    ${RN_BRIDGE}
    var progressTimer = null;
    var player = new Vimeo.Player('vimeo-player');
    window._csCurrentTime = 0;
    window._csPaused = true;
    window._csVideo = {
      get currentTime() { return window._csCurrentTime; },
      set currentTime(t) {
        player.setCurrentTime(t).then(function() {
          rn({ type: 'SEEK', currentTime: t }); window._csCurrentTime = t;
        }).catch(function() {});
      },
      play: function() { player.play().catch(function() {}); },
      pause: function() { player.pause().catch(function() {}); },
      get paused() { return window._csPaused; }
    };
    player.ready().then(function() {
      rn({ type: 'VIDEO_FOUND' });
      progressTimer = setInterval(function() {
        if (!window._csPaused) {
          player.getCurrentTime().then(function(t) {
            player.getDuration().then(function(d) {
              window._csCurrentTime = t;
              rn({ type: 'PROGRESS', currentTime: t, duration: d || 0 });
            }).catch(function() {});
          }).catch(function() {});
        }
      }, 2000);
    }).catch(function() {});
    player.on('play', function(d) { window._csPaused = false; window._csCurrentTime = d.seconds || 0; rn({ type: 'PLAY', currentTime: d.seconds || 0 }); });
    player.on('pause', function(d) { window._csPaused = true; window._csCurrentTime = d.seconds || 0; rn({ type: 'PAUSE', currentTime: d.seconds || 0 }); });
    player.on('seeked', function(d) { window._csCurrentTime = d.seconds || 0; rn({ type: 'SEEK', currentTime: d.seconds || 0 }); });
  </script>
</body></html>`;
}

/** Dailymotion embed */
export function buildDailymotionHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${BASE_HTML_STYLES} iframe { width: 100%; height: 100%; border: none; display: block; }</style>
</head><body>
  <iframe id="dm-player"
    src="https://geo.dailymotion.com/player.html?video=${videoId}&autoplay=1&controls=1"
    allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
  <script>
    ${RN_BRIDGE}
    var ct = 0, dur = 0, paused = true, progressTimer = null;
    function sendCmd(cmd, params) {
      var f = document.getElementById('dm-player');
      if (f && f.contentWindow) {
        f.contentWindow.postMessage(JSON.stringify(Object.assign({ command: cmd }, params || {})), '*');
      }
    }
    window._csVideo = {
      get currentTime() { return ct; },
      set currentTime(t) { ct = t; sendCmd('seek', { time: t }); rn({ type: 'SEEK', currentTime: t }); },
      play: function() { sendCmd('play'); },
      pause: function() { sendCmd('pause'); },
      get paused() { return paused; }
    };
    function startProgress() {
      if (progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(function() {
        if (!paused) rn({ type: 'PROGRESS', currentTime: ct, duration: dur });
      }, 2000);
    }
    window.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        switch (data.event) {
          case 'apiready': rn({ type: 'VIDEO_FOUND' }); startProgress(); break;
          case 'playing': paused = false; rn({ type: 'PLAY', currentTime: ct }); break;
          case 'pause': paused = true; rn({ type: 'PAUSE', currentTime: ct }); break;
          case 'seeked': ct = data.currentTime || ct; rn({ type: 'SEEK', currentTime: ct }); break;
          case 'timeupdate': ct = data.currentTime || ct; dur = data.duration || dur; break;
          case 'ended': paused = true; rn({ type: 'PAUSE', currentTime: ct }); break;
        }
      } catch(e) {}
    });
  </script>
</body></html>`;
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
    v.addEventListener('waiting', function() {
      rn({ type: 'BUFFERING', isBuffering: true });
    });
    v.addEventListener('playing', function() {
      rn({ type: 'BUFFERING', isBuffering: false });
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
