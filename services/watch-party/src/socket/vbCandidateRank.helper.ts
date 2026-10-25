import type { VideoCandidate } from '@shared/types';

// ── Candidate ranking ───────────────────────────────────────────────────────────────────────────
// Local test 2026-10-25 (asilmedia.org): the page played a ~26MB pre-roll ad and then the movie,
// so BOTH got `confirmed` — the old sort (confirmed, then vb-capture) kept discovery order and the
// owner was shown the ad first. Score instead on what actually separates a movie from an ad/clip:
// how long it is, whether its file name matches the page title, and ad-looking paths.
const AD_PATH_RE = /(^|[/_.-])(ads?|adv|advert\w*|preroll|pre-roll|midroll|vast|vpaid|promo|reklama|banner|commercial|sponsor\w*)([/_.-]|$)/i;
// Rough mp4 bitrate guess (~2 Mbit/s) — only turns bytes into "about how long", for ranking.
const RANK_BYTES_PER_SEC = 250_000;
const TITLE_TOKEN_RE = /[\p{L}\p{N}]{3,}/gu;
const TITLE_STOPWORDS = new Set(['smotret', 'online', 'onlayn', 'kino', 'film', 'uzbek', 'tilida', 'tarjima', 'www', 'com', 'net', 'org', 'html', 'mp4', 'm3u8', 'mpd', 'смотреть', 'онлайн', 'фильм', 'бесплатно']);

function titleTokens(text: string): Set<string> {
  return new Set((text.toLowerCase().match(TITLE_TOKEN_RE) ?? []).filter((t) => !TITLE_STOPWORDS.has(t)));
}

function decodedPath(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return decodeURIComponent(`${u.hostname}${u.pathname}`);
  } catch {
    return rawUrl;
  }
}

function candidateScore(
  c: VideoCandidate, rawUrl: string, bytes: number | undefined, confirmSeq: number, pageTokens: Set<string>,
): number {
  let score = 0;
  if (c.confirmed) score += 1000 + Math.min(confirmSeq, 10) * 15; // played later = past the pre-roll
  const path = decodedPath(rawUrl);
  if (AD_PATH_RE.test(path)) score -= 600;
  if (pageTokens.size > 0) {
    let matches = 0;
    for (const t of titleTokens(path)) if (pageTokens.has(t)) matches++;
    score += Math.min(matches * 80, 300);
  }
  const estSecs = c.duration ?? (bytes ? bytes / RANK_BYTES_PER_SEC : undefined);
  if (estSecs) score += Math.min(estSecs / 60, 150);
  if (c.url.includes('/vb-capture/')) score += 30; // replays VB's own bytes — no expiring token
  return score;
}

/** Best guess first. Reorders the parallel per-index arrays too, so later index lookups stay valid. */
export function rankCandidates(
  candidates: VideoCandidate[], rawUrls: string[], bytes: (number | undefined)[], confirmSeqs: number[], pageTitle?: string,
): void {
  const pageTokens = titleTokens(pageTitle ?? '');
  const order = candidates
    .map((c, i) => ({ i, score: candidateScore(c, rawUrls[i] ?? c.url, bytes[i], confirmSeqs[i] ?? 0, pageTokens) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.i);
  const [c0, r0, b0, s0] = [[...candidates], [...rawUrls], [...bytes], [...confirmSeqs]];
  order.forEach((from, to) => {
    candidates[to] = c0[from];
    rawUrls[to] = r0[from];
    bytes[to] = b0[from];
    confirmSeqs[to] = s0[from];
  });
}
