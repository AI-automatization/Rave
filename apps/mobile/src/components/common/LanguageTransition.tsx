import { useEffect, useRef, type PropsWithChildren } from 'react';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Animated.View style={{ flex: 1, opacity }} children={children as any} />
  );
}
