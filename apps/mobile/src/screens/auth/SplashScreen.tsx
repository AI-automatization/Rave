// CineSync Mobile — Splash Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { useAuthStore } from '@store/auth.store';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { isHydrated, isAuthenticated } = useAuthStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    // hideAsync App.tsx da chaqiriladi — bu yerda faqat navigatsiya
    const timer = setTimeout(() => {
      if (isAuthenticated) return; // AppNavigator handles redirect
      navigation.replace('Onboarding');
    }, 1800);

    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, navigation]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH * 0.5],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.logo}>CINE</Text>
        <Text style={styles.logoAccent}>SYNC</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity }]}>
        Do'stlar bilan birga ko'ring
      </Animated.Text>

      {/* Loading bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  logoAccent: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    ...typography.body,
    marginTop: 12,
    color: colors.textMuted,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 80,
    width: SCREEN_WIDTH * 0.5,
    height: 2,
    backgroundColor: colors.bgElevated,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
