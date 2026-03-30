// CineSync Mobile — Network Status Hook
// Uses AppState + fetch/AbortController (no extra packages needed)
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const CONNECTIVITY_URL = 'https://clients3.google.com/generate_204';
const TIMEOUT_MS = 4000;

async function checkConnectivity(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(CONNECTIVITY_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    return response.status === 204 || response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface NetworkStatus {
  isOnline: boolean;
  recheck: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const recheck = useCallback(async () => {
    const online = await checkConnectivity();
    setIsOnline(online);
  }, []);

  useEffect(() => {
    recheck();

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;
        if (prev !== 'active' && nextState === 'active') {
          recheck();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [recheck]);

  return { isOnline, recheck };
}
