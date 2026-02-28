import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import { useAuthStore } from '@store/auth.store';
import type { AuthStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParams, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { isLoading, isAuthenticated } = useAuthStore();
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (isAuthenticated) return; // AppNavigator switches to Main
      navigation.replace('Onboarding');
    }, 1200);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        <Text style={styles.logo}>CINE</Text>
        <Text style={styles.logoAccent}>SYNC</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 8,
    textAlign: 'center',
  },
  logoAccent: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 8,
    textAlign: 'center',
    marginTop: -8,
  },
});
