// CineSync Mobile — WebView ad blocking + URL utilities

export const AD_HOSTNAMES = [
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'connect.facebook.net',
  'scorecardresearch.com',
  'outbrain.com',
  'taboola.com',
  'popads.net',
  'exoclick.com',
  'trafficjunky.net',
  'juicyads.com',
];

export function isAdRequest(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return AD_HOSTNAMES.some(ad => hostname.includes(ad));
  } catch {
    return false;
  }
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
