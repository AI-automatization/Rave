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

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {/* Animated.View's children type comes from a react-native/@types/react copy that
          disagrees structurally with the one this file resolves (monorepo hoisting — root has
          @types/react 18, apps/mobile has its own 19). No cast closes this — the target union
          requires a `children` property that ReactElement/ReactNode don't structurally carry
          from this copy. Runtime is unaffected; children render exactly as before. */}
      {/* @ts-expect-error — dual @types/react copies in the monorepo, see comment above */}
      {children}
    </Animated.View>
  );
}
