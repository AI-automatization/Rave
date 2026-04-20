// CineSync — WebView JS injection scripts & helpers for MediaWebViewScreen
import { Platform } from 'react-native';

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

export const MOBILE_UA = Platform.OS === 'ios' ? IOS_UA : ANDROID_UA;

// Fires after page load to detect cross-origin player iframes (ashdi.vip, bazon.tv, etc.)
export const IFRAME_SCAN_JS = `
(function() {
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

// DDoS-Guard / Cloudflare challenge detection
export const BOT_PROTECTION_JS = `
(function() {
  function check() {
    try {
      var title = document.title || '';
      var html = document.documentElement ? document.documentElement.innerHTML : '';
      var isDdos = title.indexOf('DDoS-Guard') !== -1 || html.indexOf('ddos-guard.net') !== -1 || !!document.querySelector('script[src*="ddos-guard"]');
      var isCf = title.indexOf('Just a moment') !== -1 || !!document.querySelector('#cf-wrapper') || !!document.querySelector('.cf-browser-verification');
      if ((isDdos || isCf) && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BOT_PROTECTION_DETECTED' }));
      }
    } catch(e) {}
  }
  setTimeout(check, 2000);
  setTimeout(check, 5000);
  true;
})();
`;

// Collect document.cookie and send via postMessage
export const COOKIE_COLLECTION_JS = `
(function() {
  function sendCookies() {
    try {
      var raw = document.cookie;
      if (!raw) return;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'COOKIE_UPDATE', cookies: raw, domain: window.location.hostname,
      }));
    } catch(e) {}
  }
  sendCookies();
  setTimeout(sendCookies, 2000);
  setTimeout(sendCookies, 5000);
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

// Platform-specific hint text shown when no video is detected yet
export function getSourceHint(sourceId: string): string {
  switch (sourceId) {
    case 'youtube':
    case 'youtube-live': return 'YouTube da video toping va oching — avtomatik aniqlanadi';
    case 'twitch':       return 'Twitch da kanal yoki VOD ni oching';
    case 'vk':           return 'VK da videoni bosing — pleer ochilsin';
    case 'rutube':       return 'Rutube da videoni oching';
    case 'x':            return 'X (Twitter) da video postni oching';
    case 'facebook':     return 'Facebook da video post yoki Reelni oching';
    case 'instagram':    return 'Instagram da Reel yoki videoni oching';
    case 'reddit':       return 'Reddit da video postni oching';
    case 'streamable':   return 'Streamable da videoni oching';
    case 'drive':        return 'Google Drive da video faylni oching';
    default:             return 'Film yoki videoni toping va bosing — avtomatik aniqlanadi';
  }
}
