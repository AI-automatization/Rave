// WeWatch — HMAC-SHA256 signing for media-proxy URLs (GitHub issue #76).
//
// vb-media-proxy (services/watch-party) was an unauthenticated open proxy: anyone could
// pass an arbitrary `?url=` and stream it through our Railway egress. Signing the URL
// when it's minted (vbSession.helper.ts) and verifying the signature on every request
// (vbMediaProxy.controller.ts) closes that off without requiring a full user session —
// the signature is short-lived (default 6h) and bound to the exact target URL.
import crypto from 'crypto';
import { logger } from './logger';

const SHA256_HEX_LENGTH = 64; // crypto.createHmac('sha256', ...).digest('hex').length

let warnedMissingSecret = false;

/**
 * Lazily reads INTERNAL_SECRET on every call (not cached at module load) so a service
 * that sets it late in boot still picks it up. Warns once, loudly, on first use if it's
 * missing — a silent empty secret would make every signature check fail exactly the
 * same way as "URL was tampered with," which is a nasty thing to debug blind.
 */
function getSecret(): string {
  const secret = process.env.INTERNAL_SECRET ?? '';
  if (!secret && !warnedMissingSecret) {
    warnedMissingSecret = true;
    logger.warn(
      'proxySignature: INTERNAL_SECRET is not set — signProxyUrl/verifyProxyUrl will fail closed ' +
      '(all proxy URLs will be rejected as invalid). Set INTERNAL_SECRET to restore playback.',
    );
  }
  return secret;
}

/** Mints a `{ exp, sig }` pair for `target`, valid for `ttlSec` seconds (default 6h). */
export function signProxyUrl(target: string, ttlSec = 6 * 60 * 60): { exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = crypto.createHmac('sha256', getSecret()).update(`${target}|${exp}`).digest('hex');
  return { exp, sig };
}

/**
 * Verifies `sig` was produced by signProxyUrl(target, ...) for the same `exp`, and that
 * `exp` hasn't passed yet. Fails CLOSED — a missing secret, an expired exp, or a
 * malformed sig all return false, never true. crypto.timingSafeEqual requires both
 * buffers to be the same length (it throws otherwise), so the length/format is checked
 * before it's ever called.
 */
export function verifyProxyUrl(target: string, exp: number, sig: string): boolean {
  return verifyProxyUrlDetailed(target, exp, sig).ok;
}

// Root-caused 2026-08-05: some layer between vbSession.helper.ts (minting) and here (verifying)
// was decoding the query string one time too many, which only mattered for a target URL that
// itself contained a %-escape (e.g. a filename with a space) — mangling it into a different byte
// string than what was signed. Fixed by transporting the target as base64url instead of
// encodeURIComponent (see vbSession.helper.ts), which has no '%' to be vulnerable to extra
// decode passes. This detailed variant stays as a permanent diagnostic, not a temp one — cheap
// and it's already paid for itself once.
export function verifyProxyUrlDetailed(target: string, exp: number, sig: string): { ok: boolean; reason?: string } {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: 'no_secret' };

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp < now) {
    return { ok: false, reason: `expired_or_invalid_exp exp=${exp} now=${now} delta=${exp - now}` };
  }

  if (typeof sig !== 'string' || !/^[0-9a-f]{64}$/i.test(sig)) {
    return { ok: false, reason: `malformed_sig sig="${sig}" len=${typeof sig === 'string' ? sig.length : 'n/a'}` };
  }

  const expected = crypto.createHmac('sha256', secret).update(`${target}|${exp}`).digest('hex');

  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || a.length !== SHA256_HEX_LENGTH / 2) {
    return { ok: false, reason: `length_mismatch a=${a.length} b=${b.length}` };
  }

  const match = crypto.timingSafeEqual(a, b);
  if (!match) {
    return { ok: false, reason: `sig_mismatch received=${sig} expected=${expected} target="${target}" exp=${exp}` };
  }
  return { ok: true };
}
