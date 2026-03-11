// CineSync Mobile — Root Navigator
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/auth.store';
import { RootStackParamList } from '@app-types/index';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ModalNavigator } from './ModalNavigator';
import { ProfileSetupScreen } from '@screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthenticated, isHydrated, needsProfileSetup } = useAuthStore();

  if (!isHydrated) return <View style={{ flex: 1, backgroundColor: '#0A0A0F' }} />;

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
