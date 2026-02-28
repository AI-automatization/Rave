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
import { colors } from '@theme/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
    },
  },
});

function AppContent() {
  const { setUser, logout, setLoading, hydrateFromStorage } = useAuthStore();

  useSocket();
  useHeartbeat();

  useEffect(() => {
    async function bootstrap() {
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

  useEffect(() => {
    async function setupPush() {
      const granted = await requestNotificationPermission();
      if (granted) {
        await registerFcmToken();
      }
    }
    setupPush();
  }, []);

  return <AppNavigator />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
          <AppContent />
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
