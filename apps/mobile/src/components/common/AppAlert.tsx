// WeWatch Mobile — Custom themed alert (replaces RN Alert.alert)
// Dark glass modal, works identically on iOS & Android. Imperative API so it can
// be called from hooks/services, not just components:
//   import { showAlert } from '@components/common/AppAlert';
//   showAlert({ title: '...', message: '...', buttons: [{ text: 'OK' }] });
// Mount <AppAlertHost /> once near the navigation root.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal, View, Text, Pressable, Animated, StyleSheet, BackHandler, Platform,
} from 'react-native';
import { useTheme } from '@theme/index';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

// ── Imperative bridge ────────────────────────────────────────────────────────
let emitter: ((opts: AlertOptions) => void) | null = null;

/** Show a themed alert from anywhere (component, hook, service). */
export function showAlert(opts: AlertOptions): void {
  if (emitter) emitter(opts);
  else if (__DEV__) console.warn('[AppAlert] host not mounted — alert ignored');
}

// ── Host (render once at root) ───────────────────────────────────────────────
export function AppAlertHost() {
  const { colors } = useTheme();
  const [opts, setOpts] = useState<AlertOptions | null>(null);
  const backdrop = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 240 }),
    ]).start();
  }, [backdrop, scale]);

  const close = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setOpts(null);
      cb?.();
    });
  }, [backdrop, scale]);

  useEffect(() => {
    emitter = (next) => { setOpts(next); };
    return () => { emitter = null; };
  }, []);

  useEffect(() => {
    if (opts) { scale.setValue(0.92); backdrop.setValue(0); animateIn(); }
  }, [opts, animateIn, scale, backdrop]);

  // Android hardware back → trigger the cancel button (or first) if present.
  useEffect(() => {
    if (!opts || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const buttons = opts.buttons?.length ? opts.buttons : [{ text: 'OK' }];
      const cancel = buttons.find(b => b.style === 'cancel') ?? buttons[0];
      close(cancel.onPress);
      return true;
    });
    return () => sub.remove();
  }, [opts, close]);

  if (!opts) return null;

  const buttons = opts.buttons?.length ? opts.buttons : [{ text: 'OK' }];
  const stacked = buttons.length > 2;

  const colorFor = (style?: AlertButtonStyle) =>
    style === 'destructive' ? colors.error
      : style === 'cancel' ? colors.textTertiary
        : colors.primary;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={() => close()}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { /* tap-outside = no-op, force choice */ }} />
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.bgElevated, borderColor: colors.borderStrong, transform: [{ scale }] },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{opts.title}</Text>
          {!!opts.message && (
            <Text style={[styles.message, { color: colors.textTertiary }]}>{opts.message}</Text>
          )}

          <View style={[styles.actions, stacked ? styles.actionsStacked : styles.actionsRow]}>
            {buttons.map((b, i) => (
              <Pressable
                key={`${b.text}-${i}`}
                onPress={() => close(b.onPress)}
                style={({ pressed }) => [
                  styles.btn,
                  stacked ? styles.btnStacked : styles.btnRow,
                  { backgroundColor: pressed ? colors.bgMuted : 'transparent', borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: colorFor(b.style), fontWeight: b.style === 'cancel' ? '500' : '700' },
                  ]}
                >
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 12,
    // subtle elevation
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  actions: { marginTop: 22 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionsStacked: { flexDirection: 'column', gap: 8 },
  btn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnRow: { flex: 1 },
  btnStacked: { width: '100%' },
  btnText: { fontSize: 15.5 },
});
