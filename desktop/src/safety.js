// 18+ protection for the Virtual Browser. Three layers:
//   1. Cloudflare Family DNS-over-HTTPS — adult + malware blocked at name resolution, app-wide,
//      no list of ours to maintain (works for users worldwide, not just our known domains).
//   2. Our own domain blocklist (blocklist.txt) — catches what DNS misses, gives a clear reason.
//   3. Forced SafeSearch (Google/Bing/DDG/Yandex) + YouTube Restricted Mode header.
// No keyword matching on URLs: it false-positives on normal sites (sussex.ac.uk, essex...) and the
// DNS layer already covers the long tail.

const fs = require('node:fs');
const path = require('node:path');

const BLOCKED_DOMAINS = (() => {
  try {
    return fs.readFileSync(path.join(__dirname, 'blocklist.txt'), 'utf8')
      .split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter((s) => s && !s.startsWith('#'));
  } catch { return []; }
})();

function checkUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return 'invalid_url'; }
  if (!/^https?:$/.test(u.protocol)) return 'protocol_not_allowed';
  const host = u.hostname.toLowerCase();
  if (BLOCKED_DOMAINS.some((d) => host === d || host.endsWith('.' + d))) return 'blocked_domain';
  return null;
}

function safeSearchRedirect(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  const h = u.hostname;
  const set = (k, v) => { if (u.searchParams.get(k) === v) return null; u.searchParams.set(k, v); return u.toString(); };
  if (/(^|\.)google\.[a-z.]+$/.test(h) && u.pathname === '/search') return set('safe', 'active');
  if (/(^|\.)bing\.com$/.test(h) && u.pathname === '/search') return set('adlt', 'strict');
  if (/(^|\.)duckduckgo\.com$/.test(h) && u.searchParams.has('q')) return set('kp', '1');
  if (/(^|\.)yandex\.[a-z.]+$/.test(h) && u.pathname.startsWith('/search')) return set('family', 'yes');
  return null;
}

function configureDns(app) {
  app.configureHostResolver({
    secureDnsMode: 'secure',
    secureDnsServers: ['https://family.cloudflare-dns.com/dns-query'],
  });
}

/** Attach filters to the VB session. onBlocked(url, reason) is called for every blocked navigation. */
function protectSession(ses, onBlocked) {
  ses.webRequest.onBeforeRequest((details, cb) => {
    // Page and frame navigations only — leave images/scripts alone (cheap, and never breaks a CDN).
    if (details.resourceType !== 'mainFrame' && details.resourceType !== 'subFrame') { cb({}); return; }
    const reason = checkUrl(details.url);
    if (reason) { onBlocked(details.url, reason); cb({ cancel: true }); return; }
    const safe = safeSearchRedirect(details.url);
    cb(safe ? { redirectURL: safe } : {});
  });
  ses.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://youtube.com/*', '*://*.youtube-nocookie.com/*'] },
    (details, cb) => {
      details.requestHeaders['YouTube-Restrict'] = 'Moderate';
      cb({ requestHeaders: details.requestHeaders });
    },
  );
  // The shared page is for watching only — no camera/mic/location/notifications for sites.
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === 'fullscreen'));
}

module.exports = { checkUrl, configureDns, protectSession };
