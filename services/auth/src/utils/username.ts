// Cyrillic → Latin so "Жавод" becomes "Javod" instead of being stripped to nothing.
const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

const MIN_LEN = 3;
const BASE_MAX = 15; // leaves room for a numeric suffix within the 20-char limit

export function usernameBase(displayName: string): string {
  const latin = (displayName ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents: "José" -> "Jose"
    .split('')
    .map((ch) => {
      const low = ch.toLowerCase();
      const mapped = CYR_TO_LAT[low];
      if (mapped === undefined) return ch;
      return ch !== low && mapped ? mapped[0].toUpperCase() + mapped.slice(1) : mapped;
    })
    .join('')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, BASE_MAX);
  // Too short ("Al", "J", or nothing left) used to fail the 3–20 char rule on User.create,
  // which broke Google/Apple sign-up for those people.
  return latin.length >= MIN_LEN ? latin : 'user';
}
