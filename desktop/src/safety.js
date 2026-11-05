// 18+ protection for the Virtual Browser. Three layers:
//   1. Cloudflare Family DNS-over-HTTPS — adult + malware blocked at name resolution, app-wide,
//      no list of ours to maintain (works for users worldwide, not just our known domains).
//   2. Our own domain blocklist (blocklist.txt) — catches what DNS misses, gives a clear reason.
//   3. Forced SafeSearch (Google/Bing/DDG/Yandex) + YouTube Restricted Mode header.
// No keyword matching on URLs: it false-positives on normal sites (sussex.ac.uk, essex...) and the
// DNS layer already covers the long tail.
//
// OFF for now (2026-11-05, product owner's call): the Family DNS answered 0.0.0.0 for nearly every
// movie site (kinogo.*, rezka, filmix, kinokrad, asilmedia) — exactly the sites rooms are for.
// Until a list of what to block is agreed, the VB opens everything; ad blocking, http(s)-only and
// the no-permissions rule stay on. Flip to true to bring all three 18+ layers back.
const SITE_FILTER = false;

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
  if (SITE_FILTER && BLOCKED_DOMAINS.some((d) => host === d || host.endsWith('.' + d))) return 'blocked_domain';
  return null;
}

function safeSearchRedirect(raw) {
  if (!SITE_FILTER) return null;
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

// Ad networks inside the VB. Free movie sites open popunders on the first click and play pre-rolls
// (asilmedia.org: storage.dsp-ui.uz MP4s, 2026-10-25) — cancelled at the network level, so they
// never take the window or the stream. Ad-only domains only: a CDN or player SDK here would break
// playback (Google IMA is deliberately absent — players hang when it fails to load).
const AD_DOMAINS = new Set([
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com',
  'popads.net', 'popcash.net', 'propellerads.com', 'propellerclick.com', 'onclickads.net', 'onclkds.com',
  'adsterra.com', 'a-ads.com', 'exoclick.com', 'exosrv.com', 'juicyads.com', 'trafficjunky.net',
  'trafficstars.com', 'tsyndicate.com', 'hilltopads.net', 'clickadu.com', 'adcash.com',
  'adnxs.com', 'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com', 'mgid.com',
  'rubiconproject.com', 'pubmatic.com', 'openx.net', 'adform.net', 'smartadserver.com', 'admixer.net',
  'adfox.ru', 'adriver.ru', 'an.yandex.ru', 'yabs.yandex.ru', 'betweendigital.com',
]);
// Same markers as the server VB (watch-party virtualBrowser.service.ts AD_DOMAIN_MARKERS).
const AD_HOST_MARKERS = ['rtbcdn', 'dsp-ui.uz'];

const hostOf = (raw) => { try { return new URL(raw).hostname.toLowerCase(); } catch { return ''; } };

function isAdHost(host) {
  if (!host) return false;
  if (AD_HOST_MARKERS.some((m) => host.includes(m))) return true;
  for (let h = host; h.includes('.'); h = h.slice(h.indexOf('.') + 1)) {
    if (AD_DOMAINS.has(h)) return true;
  }
  return false;
}

// YouTube pages keep their ads: blocking them breaks YouTube's terms, and our search runs on its API.
const isYouTubeHost = (h) => /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(h);

// Still DNS-over-HTTPS when the filter is off: provider DNS blocks some movie sites, DoH does not.
function configureDns(app) {
  app.configureHostResolver({
    secureDnsMode: 'secure',
    secureDnsServers: [SITE_FILTER
      ? 'https://family.cloudflare-dns.com/dns-query'
      : 'https://cloudflare-dns.com/dns-query'],
  });
}

/** Attach filters to the VB session. onBlocked(url, reason) is called for every blocked navigation.
 * One onBeforeRequest per session (a second call replaces the first) — all URL rules live here. */
function protectSession(ses, onBlocked) {
  ses.webRequest.onBeforeRequest((details, cb) => {
    if (isAdHost(hostOf(details.url))
      && !isYouTubeHost(hostOf(details.webContents?.getURL() || details.referrer || ''))) {
      cb({ cancel: true });
      return;
    }
    // 18+ rules: page and frame navigations only — leave images/scripts alone (never breaks a CDN).
    if (details.resourceType !== 'mainFrame' && details.resourceType !== 'subFrame') { cb({}); return; }
    const reason = checkUrl(details.url);
    if (reason) { onBlocked(details.url, reason); cb({ cancel: true }); return; }
    const safe = safeSearchRedirect(details.url);
    cb(safe ? { redirectURL: safe } : {});
  });
  if (SITE_FILTER) {
    ses.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.youtube.com/*', '*://youtube.com/*', '*://*.youtube-nocookie.com/*'] },
      (details, cb) => {
        details.requestHeaders['YouTube-Restrict'] = 'Moderate';
        cb({ requestHeaders: details.requestHeaders });
      },
    );
  }
  // The shared page is for watching only — no camera/mic/location/notifications for sites.
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === 'fullscreen'));
}

module.exports = { checkUrl, configureDns, protectSession };
