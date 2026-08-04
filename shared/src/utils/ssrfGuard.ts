// WeWatch — Shared SSRF guard used by every reverse-proxy controller that fetches a
// caller-supplied URL: services/content/hlsProxy.controller.ts (original owner of this
// logic) and services/watch-party's vbMediaProxy.controller.ts. One implementation, one
// place to fix — vbMediaProxy previously carried its own weaker copy (string-only host
// check, no DNS resolution, no IPv6 literals, never re-checked after redirects), which
// let an SSRF walk straight past it (GitHub issue #76).
import dns from 'dns';
import { URL } from 'url';

const PRIVATE_IP_PATTERNS: ReadonlyArray<RegExp> = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  // IPv4-mapped IPv6 covering same private ranges
  /^::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/i,
];

const BLOCKED_HOSTNAMES = new Set(['localhost', '::1', '0.0.0.0']);

/** Returns an error message if the URL fails SSRF checks, null if safe. */
export function validateProxyUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'Invalid URL';
  }

  const { protocol, hostname } = parsed;

  if (protocol !== 'http:' && protocol !== 'https:') {
    return `Protocol not allowed: ${protocol}`;
  }

  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return `Hostname blocked: ${hostname}`;
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return `Private/internal IP blocked: ${hostname}`;
    }
  }

  // IPv6 literal check (bracket notation: [::1], [fc00::1])
  const ipv6Match = hostname.match(/^\[(.+)\]$/);
  if (ipv6Match) {
    const ipv6 = ipv6Match[1].toLowerCase();
    if (
      ipv6 === '::1' ||
      ipv6.startsWith('fc') ||
      ipv6.startsWith('fd') ||
      ipv6.startsWith('fe80') ||
      ipv6.startsWith('::ffff:')
    ) {
      return `Private/internal IPv6 blocked: ${hostname}`;
    }
  }

  return null;
}

// ── SSRF Guard — resolved-IP check (DNS-rebinding) ────────────────────────────
//
// validateProxyUrl() above only inspects the hostname *string*. An attacker's own
// domain (e.g. evil.example.com) trivially passes that check yet can still resolve
// to 169.254.169.254 (cloud metadata) or RFC1918 space — classic DNS rebinding.
// resolveSafeUpstream() resolves the hostname once, validates every returned IP,
// and hands back the IP the caller must actually connect to (pin the connection to
// it — see fetchBuffered / proxySegment in hlsProxy.controller.ts) so a second,
// attacker-controlled lookup right before the TCP connect can't swap in a
// different (private) address.

function isPrivateIPv4(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return true; // malformed — fail closed
  }
  const [a, b] = octets;
  if (a === 0) return true;                          // "this" network
  if (a === 10) return true;                          // RFC1918
  if (a === 127) return true;                         // loopback
  if (a === 100 && b >= 64 && b <= 127) return true;   // CGNAT (RFC6598)
  if (a === 169 && b === 254) return true;             // link-local incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;    // RFC1918
  if (a === 192 && b === 168) return true;             // RFC1918
  if (a === 192 && b === 0 && octets[2] === 0) return true; // IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true;                            // multicast (224/4), reserved (240/4), broadcast
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true; // unspecified / loopback
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7 ULA
  if (/^fe[89ab]/.test(normalized)) return true;                // fe80::/10 link-local
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(normalized);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

/** Returns true if `ip` is a private/reserved/link-local address (RFC1918, 127/8, 169.254/16, ::1, fc00::/7, ...). */
function isPrivateOrReservedIp(ip: string): boolean {
  if (ip.includes(':')) return isPrivateIPv6(ip);
  return isPrivateIPv4(ip);
}

export type SafeUpstream = { ip: string; hostname: string } | { error: string };

/**
 * Resolves `rawUrl`'s hostname via DNS and validates every returned address against
 * private/reserved ranges. Must be called (and its `ip` used to pin the connection)
 * immediately before every upstream fetch — a reverse proxy handles both the manifest
 * and every segment request, so each one is a separate opportunity for a rebind.
 */
export async function resolveSafeUpstream(rawUrl: string): Promise<SafeUpstream> {
  const { hostname } = new URL(rawUrl);

  let records: dns.LookupAddress[];
  try {
    records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  } catch (e) {
    return { error: `DNS resolution failed: ${(e as Error).message}` };
  }

  if (records.length === 0) {
    return { error: 'DNS resolution returned no addresses' };
  }

  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      return { error: `Resolved IP is private/reserved: ${record.address}` };
    }
  }

  return { ip: records[0].address, hostname };
}
