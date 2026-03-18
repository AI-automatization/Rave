// CineSync Mobile — Onboarding animation logic
import { useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';

export function useOnboardingAnimations() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const animateIconPop = useCallback(() => {
    iconScale.setValue(0.7);
    Animated.spring(iconScale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [iconScale]);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return { floatAnim, iconScale, floatTranslate, animateIconPop };
}
