// CineSync — Root App Component
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@store/auth.store';
import { useLanguageStore } from '@store/language.store';
import { onAccountBlocked } from '@api/client';
import { AppNavigator } from '@navigation/AppNavigator';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { BlockedAccountModal } from '@components/common/BlockedAccountModal';
import { ThemeProvider, useTheme } from '@theme/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
    },
  },
});

function RootApp() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    useLanguageStore.getState().hydrate();
  }, [hydrate]);

  // Listen for account blocked events from API interceptor
  useEffect(() => {
    return onAccountBlocked((reason) => {
      setBlockedReason(reason || '');
    });
  }, []);

  // Native splash screen ni hydration tugagandan so'ng darhol yashirish.
  // SplashScreen.tsx ichida emas — u render bo'lmasa hideAsync hech chaqirilmaydi.
  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isHydrated]);

  const handleBlockedClose = useCallback(() => {
    setBlockedReason(null);
  }, []);

  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
      <BlockedAccountModal
        visible={blockedReason !== null}
        reason={blockedReason ?? undefined}
        onClose={handleBlockedClose}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootApp />
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
