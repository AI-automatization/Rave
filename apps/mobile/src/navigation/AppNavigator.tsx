// CineSync Mobile — Root Navigator
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/auth.store';
import { RootStackParamList } from '@app-types/index';
import { colors } from '@theme/index';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ModalNavigator } from './ModalNavigator';
import { ProfileSetupScreen } from '@screens/auth/ProfileSetupScreen';
import { userApi } from '@api/user.api';

const Stack = createNativeStackNavigator<RootStackParamList>();

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 daqiqa (Redis TTL: 3 daqiqa)

export function AppNavigator() {
  const { isAuthenticated, isHydrated, needsProfileSetup } = useAuthStore();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <NavigationContainer>
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
