import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import AppNavigator from '@navigation/index';
import { useAuthStore } from '@store/auth.store';
import { useSocket } from '@hooks/useSocket';
import { useHeartbeat } from '@hooks/useHeartbeat';
import { authApi } from '@api/auth.api';
import { registerFcmToken, requestNotificationPermission } from '@utils/notifications';
import { initCrashReporting, setUserContext, clearUserContext } from '@utils/crash';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { colors } from '@theme/index';

initCrashReporting();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
    },
  },
});

function AppContent() {
  const { isAuthenticated, user } = useAuthStore();

  // BUG-APP-003: [user?._id] → [user?._id, user?.username] — username o'zgarganda ham Sentry yangilanadi
  useEffect(() => {
    if (user) setUserContext(user._id, user.username);
    else clearUserContext();
  }, [user?._id, user?.username]);

  useSocket();
  useHeartbeat();

  // BUG-APP-002: Zustand getState() — dep array bo'sh qoladi, ESLint warning yo'q
  useEffect(() => {
    async function bootstrap() {
      const { hydrateFromStorage, setLoading, setUser, logout } = useAuthStore.getState();
      const hasTokens = hydrateFromStorage();

      if (!hasTokens) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  // BUG-APP-001: FCM faqat login bo'lganda ro'yxatdan o'tkaziladi — 401 xatosi oldini olish
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeFcm: (() => void) | undefined;

    async function setupPush() {
      const granted = await requestNotificationPermission();
      if (granted) {
        unsubscribeFcm = await registerFcmToken();
      }
    }
    setupPush();

    return () => { unsubscribeFcm?.(); };
  }, [isAuthenticated]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
