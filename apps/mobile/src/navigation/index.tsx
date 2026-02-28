import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/auth.store';
import type { RootStackParams } from './types';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import WatchPartyScreen from '@screens/modal/WatchPartyScreen';
import WatchPartyCreateScreen from '@screens/modal/WatchPartyCreateScreen';
import BattleScreen from '@screens/modal/BattleScreen';
import BattleCreateScreen from '@screens/modal/BattleCreateScreen';
import NotificationsScreen from '@screens/modal/NotificationsScreen';

const Root = createNativeStackNavigator<RootStackParams>();

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
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
