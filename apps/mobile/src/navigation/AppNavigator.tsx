// CineSync Mobile — Root Navigator
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@store/auth.store';
import { RootStackParamList } from '@app-types/index';
import { colors } from '@theme/index';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ModalNavigator } from './ModalNavigator';
import { ProfileSetupScreen } from '@screens/auth/ProfileSetupScreen';
import { userApi } from '@api/user.api';
import { usePushNotifications } from '@hooks/usePushNotifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 daqiqa (Redis TTL: 3 daqiqa)

export function AppNavigator() {
  const { isAuthenticated, isHydrated, needsProfileSetup } = useAuthStore();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const lastResponse = Notifications.useLastNotificationResponse();

  usePushNotifications();

  // Deep link: notification tapped (background/killed)
  useEffect(() => {
    if (!lastResponse || !navigationRef.isReady()) return;
    const data = lastResponse.notification.request.content.data as Record<string, string>;
    if (data.roomId) {
      navigationRef.navigate('Modal', { screen: 'WatchParty', params: { roomId: data.roomId } });
    } else if (data.battleId) {
      navigationRef.navigate('Modal', { screen: 'Battle', params: { battleId: data.battleId } });
    }
  }, [lastResponse, navigationRef]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }
    // Darhol birinchi heartbeat
    userApi.heartbeat().catch(() => {});
    // Har 2 daqiqada qaytarish
    heartbeatRef.current = setInterval(() => {
      userApi.heartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [isAuthenticated]);

  if (!isHydrated) return <View style={{ flex: 1, backgroundColor: colors.bgBase }} />;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {isAuthenticated ? (
          needsProfileSetup ? (
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainNavigator} />
              <Stack.Screen
                name="Modal"
                component={ModalNavigator}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </>
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
