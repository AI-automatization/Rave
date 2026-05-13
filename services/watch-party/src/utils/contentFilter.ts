const FORBIDDEN_PATTERNS: RegExp[] = [
  // Pornography — English
  /\bporn(o|hub|star)?\b/i, /\bxxx\b/i, /\bsex(y|ting)?\b/i,
  /\bnude(s)?\b/i, /\bnaked\b/i, /\berot(ic|ica)\b/i,
  /\bonly.?fans\b/i, /\bbrazzers\b/i, /\bpornhub\b/i,
  /\bxvideos\b/i, /\bxhamster\b/i, /\bredtube\b/i, /\byouporn\b/i,
  /\bjavhd\b/i, /\bav(18|4k)?\b/i,
  // Pornography — Russian
  /порно/i, /порнуха/i, /секс/i, /голая/i, /голый/i, /эротика/i,
  /пизда/i, /хуй/i, /ебать/i, /ебёт/i, /трахать/i, /сиськи/i,
  // Incest
  /step.?sister/i, /step.?mom/i, /step.?brother/i, /step.?dad/i, /step.?bro/i,
  /\bincest\b/i, /сводная сестра/i, /мачеха/i, /отчим/i, /пасынок/i,
  // Violence / Snuff
  /\bsnuff\b/i, /\bgor[eе]\b/i, /beheading/i, /убийство\b/i,
  // Hentai / Anime adult
  /\bhentai\b/i, /\becchi\b/i, /\byaoi\b/i, /\byuri\b/i,
  // CSAM indicators (never allowed) — must remain last 4 entries
  /\bloli\b/i, /\bshota\b/i, /\bcp\b/i, /child.?porn/i, /детское порно/i,
];

// CSAM patterns are the last 5 entries in FORBIDDEN_PATTERNS
const CSAM_START_INDEX = FORBIDDEN_PATTERNS.length - 5;

export interface FilterResult {
  isSuspicious: boolean;
  reason: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function checkContent(text: string): FilterResult {
  if (!text) return { isSuspicious: false, reason: null, severity: 'low' };

  // CSAM — critical, check first
  const csamPatterns = FORBIDDEN_PATTERNS.slice(CSAM_START_INDEX);
  if (csamPatterns.some((p) => p.test(text))) {
    return { isSuspicious: true, reason: 'CSAM content detected', severity: 'critical' };
  }

  const matched = FORBIDDEN_PATTERNS.find((p) => p.test(text));
  if (!matched) return { isSuspicious: false, reason: null, severity: 'low' };

  const isHighSeverity = /porn|xxx|sex|голая|трахать|ебать|incest|snuff|gor[eе]|hentai/.test(matched.source);
  return {
    isSuspicious: true,
    reason: `Suspicious content: matched pattern "${matched.source}"`,
    severity: isHighSeverity ? 'high' : 'medium',
  };
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
