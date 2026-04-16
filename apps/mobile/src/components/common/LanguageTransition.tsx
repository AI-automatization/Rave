import React, { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated } from 'react-native';
import { useLanguageStore } from '@store/language.store';

export function LanguageTransition({ children }: PropsWithChildren) {
  const lang = useLanguageStore((s) => s.lang);
  const opacity = useRef(new Animated.Value(1)).current;
  const prevLang = useRef(lang);

  useEffect(() => {
    if (prevLang.current !== lang) {
      prevLang.current = lang;
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [lang, opacity]);

  // @ts-expect-error — @types/react 18.3+ bigint in ReactNode vs older RN Animated.View types mismatch
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}
