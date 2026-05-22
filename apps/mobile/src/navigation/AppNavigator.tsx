// CineSync Mobile — Root Navigator
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@store/auth.store';
import { RootStackParamList } from '@app-types/index';
import { useTheme } from '@theme/index';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ModalNavigator } from './ModalNavigator';
import { ProfileSetupScreen } from '@screens/auth/ProfileSetupScreen';
import { PrivacyPolicyScreen } from '@screens/auth/PrivacyPolicyScreen';
import { userApi } from '@api/user.api';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { LanguageTransition } from '@components/common/LanguageTransition';
import { BlockedAccountModal } from '@components/common/BlockedAccountModal';
import { onAccountBlocked } from '@api/client';
import { privacyPolicyStorage } from '@utils/storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 daqiqa (Redis TTL: 3 daqiqa)

export function AppNavigator() {
  const { isAuthenticated, isHydrated, needsProfileSetup } = useAuthStore();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const lastResponse = Notifications.useLastNotificationResponse();
  const { colors } = useTheme();

  const [blockedVisible, setBlockedVisible] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [blockedUserId, setBlockedUserId] = useState('');
  const [isNavReady, setIsNavReady] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean | null>(null);

  usePushNotifications();

  // Check privacy acceptance when user logs in
  useEffect(() => {
    if (!isAuthenticated || !isHydrated) {
      setPrivacyAccepted(null);
      return;
    }
    privacyPolicyStorage.isAccepted().then(setPrivacyAccepted);
  }, [isAuthenticated, isHydrated]);

  // Global ACCOUNT_BLOCKED listener
  useEffect(() => {
    return onAccountBlocked(({ reason, userId }) => {
      setBlockedReason(reason);
      setBlockedUserId(userId);
      setBlockedVisible(true);
    });
  }, []);

  // Deep link: notification tapped (background/killed)
  // isNavReady dependency ensures cold-start case works:
  // killed app → lastResponse set → NavigationContainer not ready → isNavReady=false
  // onReady fires → isNavReady=true → this effect re-runs → navigate succeeds
  useEffect(() => {
    if (!lastResponse || !isNavReady || !isAuthenticated || needsProfileSetup) return;
    const data = lastResponse.notification.request.content.data as Record<string, string>;
    const screen = data.screen;

    if (data.inviteCode) {
      navigationRef.navigate('Modal', { screen: 'WatchPartyJoin', params: { inviteCode: data.inviteCode } });
    } else if (data.roomId) {
      navigationRef.navigate('Modal', { screen: 'WatchParty', params: { roomId: data.roomId } });
    } else if (data.type === 'support_reply' || screen === 'SupportChat') {
      navigationRef.navigate('Modal', { screen: 'SupportChat' });
    } else if (screen === 'Friends') {
      navigationRef.navigate('Main');
    } else if (screen === 'Notifications') {
      navigationRef.navigate('Modal', { screen: 'Notifications' });
    }
  }, [lastResponse, isNavReady, isAuthenticated, needsProfileSetup, navigationRef]);

  // Deep link: wewatch://join/:inviteCode
  useEffect(() => {
    if (!isAuthenticated || !navigationRef.isReady()) return;

    const handleDeepLink = (url: string) => {
      const match = url.match(/wewatch:\/\/join\/([A-Fa-f0-9]{6})/i);
      if (match) {
        navigationRef.navigate('Modal', {
          screen: 'WatchPartyJoin',
          params: { inviteCode: match[1].toUpperCase() },
        });
      }
    };

    // Handle URL that opened the app (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URL while app is running (warm start)
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, [isAuthenticated, navigationRef]);

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

  if (!isHydrated || (isAuthenticated && privacyAccepted === null)) {
    return <View style={{ flex: 1, backgroundColor: colors.bgBase }} />;
  }

  return (
    <>
    <NavigationContainer ref={navigationRef} onReady={() => setIsNavReady(true)}>
      <LanguageTransition>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {isAuthenticated ? (
            !privacyAccepted ? (
              <Stack.Screen name="PrivacyPolicy" options={{ gestureEnabled: false }}>
                {() => <PrivacyPolicyScreen onAccepted={() => setPrivacyAccepted(true)} />}
              </Stack.Screen>
            ) : needsProfileSetup ? (
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
      </LanguageTransition>
    </NavigationContainer>

    <BlockedAccountModal
      visible={blockedVisible}
      reason={blockedReason}
      userId={blockedUserId}
      onClose={() => setBlockedVisible(false)}
    />
  </>
  );
}
