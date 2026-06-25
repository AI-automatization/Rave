// WeWatch — WebView JS injection scripts & helpers for MediaWebViewScreen
import { Platform } from 'react-native';

// Desktop UA — for video player WebViews (YouTube embed, etc.)
const IOS_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/18.3 Safari/605.1.15';

const ANDROID_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

export const MOBILE_UA = Platform.OS === 'ios' ? IOS_UA : ANDROID_UA;

// Mobile UA — for in-app browser (MediaWebViewScreen), renders proper mobile layout
const IOS_BROWSER_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';

const ANDROID_BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36';

export const BROWSER_MOBILE_UA = Platform.OS === 'ios' ? IOS_BROWSER_UA : ANDROID_BROWSER_UA;

// Auth/utility domains where IFRAME_SCAN must not run — they contain iframes unrelated to video
const AUTH_DOMAINS = [
  'accounts.google.com', 'google.com/signin', 'login.live.com',
  'auth.vk.com', 'oauth.vk.com', 'recaptcha.google.com',
];

// Fires after page load to detect cross-origin player iframes (ashdi.vip, bazon.tv, etc.)
// Skipped on auth/sign-in pages to prevent redirect to reCAPTCHA/analytics iframes
export const IFRAME_SCAN_JS = `
(function() {
  var authDomains = ${JSON.stringify(AUTH_DOMAINS)};
  var host = window.location.hostname + window.location.pathname;
  for (var i = 0; i < authDomains.length; i++) {
    if (host.indexOf(authDomains[i]) !== -1) return;
  }
  function scanIframes() {
    try {
      var iframes = document.querySelectorAll('iframe[src]');
      var urls = [];
      for (var i = 0; i < iframes.length; i++) {
        var src = iframes[i].src;
        if (src && src.indexOf('http') === 0 && src !== window.location.href) urls.push(src);
      }
      if (urls.length && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'IFRAME_FOUND', urls: urls }));
      }
    } catch(e) {}
  }
  setTimeout(scanIframes, 2500);
  setTimeout(scanIframes, 6000);
  true;
})();
`;

// DDoS-Guard / Cloudflare / Google reCAPTCHA challenge detection
export const BOT_PROTECTION_JS = `
(function() {
  function check() {
    try {
      var title = document.title || '';
      var html = document.documentElement ? document.documentElement.innerHTML : '';
      var isDdos = title.indexOf('DDoS-Guard') !== -1 || html.indexOf('ddos-guard.net') !== -1 || !!document.querySelector('script[src*="ddos-guard"]');
      var isCf = title.indexOf('Just a moment') !== -1 || !!document.querySelector('#cf-wrapper') || !!document.querySelector('.cf-browser-verification');
      var isRecaptcha = !!document.querySelector('.g-recaptcha') || !!document.querySelector('iframe[src*="recaptcha"]') || title.indexOf('reCAPTCHA') !== -1 || window.location.hostname === 'www.google.com' && html.indexOf('recaptcha') !== -1;
      if ((isDdos || isCf || isRecaptcha) && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BOT_PROTECTION_DETECTED' }));
      }
    } catch(e) {}
  }
  setTimeout(check, 2000);
  setTimeout(check, 5000);
  true;
})();
`;

// Known placeholder / ad video URL patterns — skip these during detection
export function isPlaceholderVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (/\/blank\.(mp4|webm|ogg)(\?|#|$)/.test(lower)) return true;
  if (/\/templates\/\d+\/\d+\//.test(lower)) return true;
  return false;
}

// Injected into hidden VK/Rutube sniffing WebView (Android only).
// Overrides XHR/fetch/video.src before player scripts run — catches first CDN video URL.
// The hidden WebView uses source={{ uri }} (not html) so JS runs in vk.com/rutube.ru
// origin — same origin as the player's XHR calls — giving us access to intercept them.
// Audio is muted via HTMLMediaElement.prototype.play override so the hidden WebView is silent.
export const CDN_SNIFF_JS = `
(function() {
  var sent = false;
  function tryReport(url) {
    if (sent || typeof url !== 'string' || url.length < 20) return;
    var u = url.toLowerCase().split('?')[0];
    // VK CDN domains: okcdn.ru (HLS master), *.userapi.com, vkuservideo.net, vkvideo.ru
    var isVkCdn = /okcdn\\.ru|userapi\\.com|vkuservideo\\.net|vkvideo\\.ru/.test(u);
    var isStream = isVkCdn
      || /\\.m3u8$|\\.mp4$|\\.ts$/.test(u)
      || /\\/(hls|stream|chunklist)[\\/?]/.test(u)
      || /\\/(index|master|playlist|video)\\.m3u8/.test(u);
    if (!isStream) return;
    if (/ads?[_\\-]|preroll|midroll|postroll/i.test(url)) return;
    sent = true;
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'CDN_URL_SNIFFED', url: url })
    );
  }
  try {
    var d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (d && d.set) Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true, enumerable: true, get: d.get,
      set: function(v) { tryReport(v); d.set.call(this, v); }
    });
  } catch(e) {}
  try {
    var _xo = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m, url) { tryReport(url); return _xo.apply(this, arguments); };
  } catch(e) {}
  try {
    var _f = window.fetch;
    window.fetch = function(r, o) { if (typeof r === 'string') tryReport(r); return _f.apply(this, arguments); };
  } catch(e) {}
  try {
    var _play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
      this.muted = true;
      this.volume = 0;
      if (this.src) tryReport(this.src);
      return _play.call(this);
    };
  } catch(e) {}
  // Poll video elements every 500ms — catches src set after player init
  var pollCount = 0;
  var poll = setInterval(function() {
    if (sent || ++pollCount > 40) { clearInterval(poll); return; }
    try {
      var videos = document.querySelectorAll('video');
      for (var i = 0; i < videos.length; i++) {
        var s = videos[i].src || videos[i].currentSrc;
        if (s) tryReport(s);
      }
    } catch(e) {}
  }, 500);
  true;
})();
`;

// Platform-specific hint text shown when no video is detected yet
export function getSourceHint(sourceId: string): string {
  switch (sourceId) {
    case 'youtube':
    case 'youtube-live': return 'YouTube da video toping va oching — avtomatik aniqlanadi';
    case 'twitch':       return 'Twitch da kanal yoki VOD ni oching';
    case 'vk':           return 'VK da videoni bosing — pleer ochilsin';
    case 'rutube':       return 'Rutube da videoni oching';
    case 'instagram':    return 'Instagram da Reel yoki videoni oching';
    case 'drive':        return 'Google Drive da video faylni oching';
    default:             return 'Film yoki videoni toping va bosing — avtomatik aniqlanadi';
  }
}
