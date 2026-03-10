// CineSync Mobile — Search Hook
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { contentApi } from '@api/content.api';
import { ContentGenre, IMovie } from '@app-types/index';

const HISTORY_KEY = 'cinesync_search_history';
const MAX_HISTORY = 10;
const DEBOUNCE_MS = 500;

async function loadHistory(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function saveHistory(history: string[]): Promise<void> {
  await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(history));
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const addToHistory = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    setHistory(updated);
    await saveHistory(updated);
  }, [history]);

  const removeFromHistory = useCallback(async (query: string) => {
    const updated = history.filter((h) => h !== query);
    setHistory(updated);
    await saveHistory(updated);
  }, [history]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await saveHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}

export function useSearchResults(
  query: string,
  genre: ContentGenre | null,
  page: number,
) {
  return useQuery({
    queryKey: ['search', query, genre, page],
    queryFn: () =>
      contentApi.getMovies({ search: query, genre: genre ?? undefined, page, limit: 20 }),
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDebounce(value: string, delay = DEBOUNCE_MS): string {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);

  return debounced;
}

export const GENRES: Array<{ label: string; value: ContentGenre }> = [
  { label: 'Action', value: 'action' },
  { label: 'Comedy', value: 'comedy' },
  { label: 'Drama', value: 'drama' },
  { label: 'Horror', value: 'horror' },
  { label: 'Thriller', value: 'thriller' },
  { label: 'Romance', value: 'romance' },
  { label: 'Sci-Fi', value: 'sci-fi' },
  { label: 'Animation', value: 'animation' },
  { label: 'Documentary', value: 'documentary' },
  { label: 'Fantasy', value: 'fantasy' },
];
