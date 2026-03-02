import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/auth.store';
import { tokenStorage } from '@utils/storage';
import { APP_DEEP_LINK_PREFIX } from '@utils/config';
import type { RootStackParams } from './types';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import WatchPartyScreen from '@screens/modal/WatchPartyScreen';
import WatchPartyCreateScreen from '@screens/modal/WatchPartyCreateScreen';
import BattleScreen from '@screens/modal/BattleScreen';
import BattleCreateScreen from '@screens/modal/BattleCreateScreen';
import NotificationsScreen from '@screens/modal/NotificationsScreen';

const Root = createNativeStackNavigator<RootStackParams>();

// Deep link routing — React Navigation
const linking: LinkingOptions<RootStackParams> = {
  prefixes: [APP_DEEP_LINK_PREFIX, 'https://cinesync.app'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: 'home',
        },
      },
      WatchParty: 'watch-party/:roomId',
      Battle: 'battle/:battleId',
    },
  },
};

// OAuth callback URL ni parse qilish
// Format: cinesync://auth/callback?accessToken=xxx&refreshToken=yyy
function parseOAuthCallback(url: string): { accessToken: string; refreshToken: string } | null {
  if (!url.includes('auth/callback')) return null;
  try {
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) return { accessToken, refreshToken };
  } catch {
    // malformed URL
  }
  return null;
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setAuth, logout } = useAuthStore();

  // OAuth deep link callback — app yopiq bo'lganda ochilsa
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const tokens = parseOAuthCallback(url);
      if (tokens) {
        tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
        // authApi.getMe() App.tsx bootstrap da chaqiriladi — faqat tokenlarni saqlaymiz
      }
    });

    // App ochiq bo'lganda deep link kelsa
    const sub = Linking.addEventListener('url', ({ url }) => {
      const tokens = parseOAuthCallback(url);
      if (tokens) {
        tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
        // getMe → setAuth — App.tsx bootstrap orqali
        import('@api/auth.api').then(({ authApi }) => {
          authApi.getMe().then((res) => {
            if (res.success && res.data) setAuth(res.data, tokens.accessToken, tokens.refreshToken);
            else logout();
          }).catch(() => logout());
        });
      }
    });

    return () => sub.remove();
  }, [setAuth, logout]);

  return (
    <NavigationContainer linking={linking}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Root.Screen name="Main" component={MainTabs} />
            <Root.Group screenOptions={{ presentation: 'modal' }}>
              <Root.Screen name="WatchParty" component={WatchPartyScreen} />
              <Root.Screen name="WatchPartyCreate" component={WatchPartyCreateScreen} />
              <Root.Screen name="Battle" component={BattleScreen} />
              <Root.Screen name="BattleCreate" component={BattleCreateScreen} />
              <Root.Screen name="Notifications" component={NotificationsScreen} />
            </Root.Group>
          </>
        ) : (
          <Root.Screen name="Auth" component={AuthStack} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
