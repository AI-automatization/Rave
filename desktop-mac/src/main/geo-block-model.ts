// "Not available in your region" pages inside the VB. Film sites answer a region block with an ordinary page (HTTP 200)
// that says so in words — uzmovi.net (2026-11-11): "HUDUDIY CHEKLOV · Bu film hududingizda mavjud emas". The room then
// shows the owner a notice and looks for the same film elsewhere, instead of streaming that page to everyone.
// The block itself is never worked around (no VPN / proxy): that is the rights holder's decision.
// Pure — no Electron imports — unit-tested.

// Whole phrases only: "mavjud emas" / "недоступно" alone appear on ordinary pages ("Izohlar mavjud emas").
const GEO_PHRASES: readonly RegExp[] = [
  /hudud(?:ingiz|iy)\w*[^.\n]{0,40}(?:mavjud emas|cheklov|ko['‘’`]?rish mumkin emas|namoyish eta olmaymiz)/i,
  /hududiy cheklov/i,
  /mamlakatingizda[^.\n]{0,30}mavjud emas/i,
  /ҳудуд(?:ингиз|ий)\S*[^.\n]{0,40}(?:мавжуд эмас|чеклов)/i,
  /недоступн\S*\s+в\s+(?:вашем\s+регионе|вашей\s+стране)/i,
  /не\s+доступн\S*\s+в\s+(?:вашем\s+регионе|вашей\s+стране)/i,
  /not\s+available\s+in\s+your\s+(?:country|region|location|area)/i,
  /unavailable\s+in\s+your\s+(?:country|region|location)/i,
];

/** True when the page text reads like a region-block notice. */
export function isGeoBlocked(text: string): boolean {
  if (typeof text !== 'string' || text.length === 0) return false;
  return GEO_PHRASES.some((re) => re.test(text));
}

/** Run in the VB page: the first part of its visible text (where such notices sit). Bounded, read-only. */
export const GEO_PROBE_SCRIPT = `(() => { try { return String(document.body ? document.body.innerText : '').slice(0, 4000); } catch { return ''; } })()`;
