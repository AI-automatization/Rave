// T-E111 — Dynamic blocked-domains: fetched from server, cached in AsyncStorage 24h.
// Merges with the static BLOCKED_DOMAINS list in blockedDomains.ts.
// Falls back to empty list (static list still active) when network is unavailable.

import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';
import { contentApi } from '@api/content.api';

const STORAGE_KEY = 'dynamic_blocked_domains_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — admin changes propagate quickly

interface CacheEntry {
  domains: string[];
  fetchedAt: number;
}

// Module-level set — shared across all hook instances
let dynamicBlockedSet = new Set<string>();
let lastFetchedAt = 0;

export function isDynamicDomainBlocked(hostname: string): boolean {
  return dynamicBlockedSet.has(hostname);
}

async function loadFromStorage(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return;
    const entry = JSON.parse(raw) as CacheEntry;
    dynamicBlockedSet = new Set(entry.domains);
    lastFetchedAt = entry.fetchedAt;
  } catch { /* corrupt cache — ignore */ }
}

async function fetchAndCache(): Promise<void> {
  try {
    const domains = await contentApi.getBlockedDomains();
    dynamicBlockedSet = new Set(domains.map((d) => d.toLowerCase().replace(/^www\./, '')));
    lastFetchedAt = Date.now();
    const entry: CacheEntry = { domains, fetchedAt: lastFetchedAt };
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(entry));
  } catch { /* network unavailable — keep existing set */ }
}

function isCacheStale(): boolean {
  return Date.now() - lastFetchedAt > CACHE_TTL_MS;
}

export function useDynamicBlockedDomains(): void {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Load from storage immediately (synchronous-like — no network needed)
    void loadFromStorage().then(() => {
      // Fetch fresh data if cache is stale
      if (isCacheStale()) void fetchAndCache();
    });

    // Refresh on foreground resume if cache is stale (T-E117)
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && isCacheStale()) {
        void fetchAndCache();
      }
    });

    return () => subscription.remove();
  }, []);
}
