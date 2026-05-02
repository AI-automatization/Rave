// CineSync — Generic fade+slide-in animation wrapper
import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

interface Props {
  delay?: number;
  children: React.ReactNode;
  style?: object;
}

export function FadeSlideIn({ delay = 0, children, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      const easing = Easing.out(Easing.cubic);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, easing, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, easing, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children as unknown as React.ReactElement<unknown, string>}
    </Animated.View>
  );
}
