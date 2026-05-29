// WeWatch Mobile — Root Navigator
import React, { useEffect, useRef, useState } from 'react';
import { View, AppState, type AppStateStatus } from 'react-native';
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
import { MaintenanceScreen } from '@components/common/MaintenanceScreen';
import { UpdateRequiredScreen } from '@components/common/UpdateRequiredScreen';
import { onAccountBlocked } from '@api/client';
import { privacyPolicyStorage } from '@utils/storage';
import { adminApi } from '@api/admin.api';
import Constants from 'expo-constants';
import { analyticsService } from '@services/analyticsService';
import { getActiveScreenName } from '@hooks/useScreenTracking';

const Stack = createNativeStackNavigator<RootStackParamList>();

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

// Returns -1 if a < b, 0 if equal, 1 if a > b
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
} // 2 daqiqa (Redis TTL: 3 daqiqa)

export function AppNavigator() {
  const { isAuthenticated, isHydrated, needsProfileSetup, user } = useAuthStore();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const lastResponse = Notifications.useLastNotificationResponse();
  const { colors } = useTheme();

  const [blockedVisible, setBlockedVisible] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [blockedUserId, setBlockedUserId] = useState('');
  const [isNavReady, setIsNavReady] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceChecking, setMaintenanceChecking] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const maintenanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const checkMaintenance = async () => {
    try {
      const cfg = await adminApi.getAppConfig();
      setMaintenanceMode(cfg.maintenanceMode === true);

      // Check minimum required version
      const appVersion: string = Constants.expoConfig?.version ?? '1.0.0';
      const minVersion = cfg.minAppVersionIos;
      if (minVersion && compareVersions(appVersion, minVersion) < 0) {
        setUpdateRequired(true);
      } else {
        setUpdateRequired(false);
      }
    } catch {
      // Unreachable endpoint — don't block the app
    }
  };

  const handleMaintenanceRetry = async () => {
    setMaintenanceChecking(true);
    await checkMaintenance();
    setMaintenanceChecking(false);
  };

  // Check on startup
  useEffect(() => {
    void checkMaintenance();
  }, []);

  // Poll every 2 minutes regardless of maintenance status
  // (so admin can turn it ON while user is already in the app)
  useEffect(() => {
    maintenanceTimerRef.current = setInterval(() => { void checkMaintenance(); }, 2 * 60 * 1000);
    return () => {
      if (maintenanceTimerRef.current) clearInterval(maintenanceTimerRef.current);
    };
  }, []);

  // Check when app comes to foreground from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        void checkMaintenance();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  usePushNotifications();

  // Check privacy acceptance when user logs in (per-user, keyed by userId)
  useEffect(() => {
    if (!isAuthenticated || !isHydrated || !user?._id) {
      setPrivacyAccepted(null);
      return;
    }
    privacyPolicyStorage.isAccepted(user._id).then(setPrivacyAccepted);
  }, [isAuthenticated, isHydrated, user?._id]);

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

  // Analytics: init/update session when auth state changes
  useEffect(() => {
    if (isHydrated) {
      if (isAuthenticated && user?._id) {
        analyticsService.setUser(user._id);
      }
    }
  }, [isAuthenticated, isHydrated, user?._id]);

  // Analytics: init session on mount
  useEffect(() => {
    analyticsService.init(undefined, false);
    return () => { void analyticsService.end(); };
  }, []);

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

  if (updateRequired) {
    return <UpdateRequiredScreen />;
  }

  if (maintenanceMode) {
    return <MaintenanceScreen onRetry={handleMaintenanceRetry} retrying={maintenanceChecking} />;
  }

  return (
    <>
    <NavigationContainer
        ref={navigationRef}
        onReady={() => setIsNavReady(true)}
        onStateChange={(state) => {
          const screen = getActiveScreenName(state);
          if (screen) analyticsService.screenEnter(screen);
        }}
      >
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
