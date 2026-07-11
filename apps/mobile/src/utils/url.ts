// WeWatch Mobile — nisbiy media yo'llarini (avatar, uploads) absolyut URL'ga aylantirish
// Backend avatar'ni ba'zan nisbiy yo'l ("/uploads/avatars/..") qaytaradi — uni host bilan to'ldiramiz.

// Avatarlar user servisi tomonidan host root'da beriladi (/api/v1 emas)
const USER_ORIGIN = (process.env.EXPO_PUBLIC_USER_URL ?? '').replace(/\/api\/v1\/?$/, '');

/**
 * Nisbiy media yo'lini absolyut URL'ga aylantiradi.
 * - Allaqachon absolyut (http/https/data/file) bo'lsa — o'zgarishsiz qaytaradi (masalan Google avatar).
 * - Bo'sh/null bo'lsa — undefined qaytaradi (fallback ishlaydi).
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|file:)/i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${USER_ORIGIN}${normalized}`;
}
