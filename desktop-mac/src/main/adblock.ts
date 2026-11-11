// Ad networks inside the VB. Free movie sites open popunders on the first click and play pre-rolls
// (asilmedia.org: storage.dsp-ui.uz MP4s, 2026-10-25). They are cancelled at the network level, so they
// never take the window or the stream. List = the Windows build's list (same product decision).
// Ad-only domains ONLY: a CDN or player SDK here would break playback (Google IMA is deliberately absent —
// players hang when it fails to load; rtbcdn.ru is Rutube's own CDN, blocking it left Rutube without a
// player: 336 requests cancelled on one video page, 2026-11-05).
export const AD_DOMAINS: ReadonlySet<string> = new Set([
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com',
  'popads.net', 'popcash.net', 'propellerads.com', 'propellerclick.com', 'onclickads.net', 'onclkds.com',
  'adsterra.com', 'a-ads.com', 'exoclick.com', 'exosrv.com', 'juicyads.com', 'trafficjunky.net',
  'trafficstars.com', 'tsyndicate.com', 'hilltopads.net', 'clickadu.com', 'adcash.com',
  'adnxs.com', 'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com', 'mgid.com',
  'rubiconproject.com', 'pubmatic.com', 'openx.net', 'adform.net', 'smartadserver.com', 'admixer.net',
  'adfox.ru', 'adriver.ru', 'an.yandex.ru', 'yabs.yandex.ru', 'betweendigital.com',
]);
export const AD_HOST_MARKERS: readonly string[] = ['dsp-ui.uz'];

// Ads a site serves from its OWN hosts, so neither the list above nor EasyList/RU AdList knows them. Exact paths
// only — the rest of the site (its player, its film stream) must keep loading. uzmovi.net (2026-11-11): the pre-roll
// MP4s live under story.uzmovi.net/ads/videos/, view events go to uzmovi.net/ads/video/event, and
// /js/video-ad-manager.js runs the pre-roll. Blocking only /ads/ left a 7 s black wait before the film (the manager
// waits for the failed MP4); blocking the manager as well starts the film at once — 12 s of ad before.
export const AD_PATHS: readonly { host: string; prefix: string }[] = [
  { host: 'uzmovi.net', prefix: '/ads/' },
  { host: 'uzmovi.net', prefix: '/js/video-ad-manager.js' },
];

export const hostOf = (raw: string): string => {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
};

/** True when `host` is an ad network host or any subdomain of one (suffix walk, never a substring match). */
export function isAdHost(host: string): boolean {
  if (!host) return false;
  if (AD_HOST_MARKERS.some((m) => host.includes(m))) return true;
  for (let h = host; h.includes('.'); h = h.slice(h.indexOf('.') + 1)) {
    if (AD_DOMAINS.has(h)) return true;
  }
  return false;
}

// YouTube pages keep their ads: blocking them breaks YouTube's terms, and our search runs on its API.
export const isYouTubeHost = (h: string): boolean => /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(h);

/** True for a site's own ad path from AD_PATHS (host or any subdomain of it, path prefix). */
export function isAdPath(requestUrl: string): boolean {
  let u: URL;
  try {
    u = new URL(requestUrl);
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  return AD_PATHS.some((r) => (host === r.host || host.endsWith('.' + r.host)) && u.pathname.startsWith(r.prefix));
}

/** Should the VB cancel this request? `pageUrl` = the top-level page that issued it. */
export function shouldBlockAd(requestUrl: string, pageUrl: string): boolean {
  return (isAdHost(hostOf(requestUrl)) || isAdPath(requestUrl)) && !isYouTubeHost(hostOf(pageUrl));
}
