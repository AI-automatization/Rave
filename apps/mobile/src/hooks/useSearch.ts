import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { contentApi } from '@api/content.api';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;
const DEBOUNCE_MS = 400;

export function useSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on mount
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  // Debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const results = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => contentApi.searchMovies(debouncedQuery, 1, 20),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
    select: (res) => res.data ?? [],
  });

  const saveToHistory = async (term: string) => {
    const next = [term, ...history.filter((h) => h !== term)].slice(0, MAX_HISTORY);
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const removeFromHistory = async (term: string) => {
    const next = history.filter((h) => h !== term);
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  const submit = () => {
    if (debouncedQuery.length >= 2) saveToHistory(debouncedQuery);
  };

  return {
    query,
    setQuery,
    debouncedQuery,
    results: results.data ?? [],
    isLoading: results.isLoading && debouncedQuery.length >= 2,
    history,
    submit,
    removeFromHistory,
    clearHistory,
  };
}
