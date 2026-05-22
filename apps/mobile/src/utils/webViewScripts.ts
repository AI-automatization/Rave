// WeWatch — WebView JS injection scripts & helpers for MediaWebViewScreen
import { Platform } from 'react-native';

// Desktop UA — prevents YouTube/Google from redirecting to sign-in in WebView
const IOS_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.4 Safari/605.1.15';

const ANDROID_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const MOBILE_UA = Platform.OS === 'ios' ? IOS_UA : ANDROID_UA;

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
