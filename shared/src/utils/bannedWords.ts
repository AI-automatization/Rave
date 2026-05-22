import { logger } from './logger';
import { axios, AxiosError, internalHeaders, adminServiceUrl } from './serviceConfig';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let cachedWords: Set<string> = new Set();
let cacheExpiresAt = 0;
let pendingFetch: Promise<Set<string>> | null = null;

async function fetchFromAdmin(): Promise<Set<string>> {
  try {
    const res = await axios.get<{ data: { words: string[] } }>(
      `${adminServiceUrl}/api/v1/internal/moderation/banned-words`,
      { headers: internalHeaders, timeout: 5000 },
    );
    const words = res.data?.data?.words ?? [];
    logger.info('[bannedWords] cache refreshed', { count: words.length });
    return new Set(words.map((w) => w.toLowerCase()));
  } catch (err) {
    const error = err as AxiosError;
    logger.warn('[bannedWords] failed to fetch — using empty list', { message: error.message });
    return new Set();
  }
}

async function getWordSet(): Promise<Set<string>> {
  if (Date.now() < cacheExpiresAt) return cachedWords;
  if (pendingFetch) return pendingFetch;

  pendingFetch = fetchFromAdmin().then((words) => {
    cachedWords = words;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    pendingFetch = null;
    return words;
  });

  return pendingFetch;
}

export async function containsBannedWord(text: string): Promise<boolean> {
  if (!text?.trim()) return false;
  const words = await getWordSet();
  if (!words.size) return false;
  const normalized = text.toLowerCase();
  for (const banned of words) {
    if (normalized.includes(banned)) return true;
  }
  return false;
}

export function invalidateBannedWordsCache(): void {
  cacheExpiresAt = 0;
}
