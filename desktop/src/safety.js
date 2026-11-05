// Virtual Browser session rules: http(s) only, ad networks cancelled, no site permissions, and
// DNS-over-HTTPS app-wide. No site filter — the VB opens any site (product owner's call, 2026-11-05).

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
// Server VB (watch-party virtualBrowser.service.ts AD_DOMAIN_MARKERS) also has 'rtbcdn' — not here:
// rtbcdn.ru is Rutube's own CDN (static.rtbcdn.ru = its JS/CSS, pic.rtbcdn.ru = covers). Blocking it
// left Rutube pages without a player (336 requests cancelled on one video page, 2026-11-05).
const AD_HOST_MARKERS = ['dsp-ui.uz'];

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

// What a video player may ask for: fullscreen, DRM key systems (EME — denying it fails every
// encrypted stream), storage access for embedded third-party players, pointer/keyboard lock in
// fullscreen, copy-link buttons, audio output choice. Never camera/mic, location, notifications or
// screen capture — the VB is for watching, and its window is streamed to the room.
const VB_PERMISSIONS = new Set([
  'fullscreen', 'mediaKeySystem', 'storage-access', 'top-level-storage-access',
  'pointerLock', 'keyboardLock', 'clipboard-sanitized-write', 'speaker-selection',
]);

/** null when the VB may open `raw`, otherwise the reason it may not (only http(s) pages open). */
function checkUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return 'invalid_url'; }
  if (!/^https?:$/.test(u.protocol)) return 'protocol_not_allowed';
  return null;
}

// Provider DNS blocks some sites; DoH resolves them.
function configureDns(app) {
  app.configureHostResolver({
    secureDnsMode: 'secure',
    secureDnsServers: ['https://cloudflare-dns.com/dns-query'],
  });
}

/** Attach the rules to the VB session. onBlocked(url, reason) is called for every refused navigation.
 * One onBeforeRequest per session (a second call replaces the first) — all URL rules live here. */
function protectSession(ses, onBlocked) {
  ses.webRequest.onBeforeRequest((details, cb) => {
    if (isAdHost(hostOf(details.url))
      && !isYouTubeHost(hostOf(details.webContents?.getURL() || details.referrer || ''))) {
      cb({ cancel: true });
      return;
    }
    // Page and frame navigations only — images/scripts are left alone (never breaks a CDN).
    if (details.resourceType !== 'mainFrame' && details.resourceType !== 'subFrame') { cb({}); return; }
    // Our error page (main.js failPage) is a data: load we start ourselves; cancelling it left the
    // view black again. Chromium itself refuses data: in the top frame when a page starts it.
    if (details.resourceType === 'mainFrame' && details.url.startsWith('data:')) { cb({}); return; }
    const reason = checkUrl(details.url);
    if (reason) { onBlocked(details.url, reason); cb({ cancel: true }); return; }
    cb({});
  });
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(VB_PERMISSIONS.has(perm)));
}

module.exports = { checkUrl, configureDns, protectSession };
