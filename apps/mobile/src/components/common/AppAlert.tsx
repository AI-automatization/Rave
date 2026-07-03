// WeWatch Mobile — custom themed alert (replaces RN Alert.alert).
// Frosted-glass modal, spring animation, typed icons, gradient buttons.
// Works identically on iOS & Android. Imperative API — call from anywhere:
//   import { appAlert, showAlert } from '@components/common/AppAlert';
//   appAlert('Title', 'Message', [{ text: 'OK' }]);            // RN Alert.alert-compatible
//   showAlert({ title, message, buttons, type: 'success' });   // richer object form
// Mount <AppAlertHost /> once near the navigation root.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal, View, Text, Pressable, Animated, StyleSheet, BackHandler, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';
export type AlertType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: AlertType;
}

// ── Imperative bridge ────────────────────────────────────────────────────────
let emitter: ((opts: AlertOptions) => void) | null = null;

/** Show a themed alert (object form). */
export function showAlert(opts: AlertOptions): void {
  if (emitter) emitter(opts);
  else if (__DEV__) console.warn('[AppAlert] host not mounted — alert ignored');
}

/** RN Alert.alert-compatible signature — drop-in replacement. */
export function appAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  showAlert({ title, message, buttons });
}

const ICONS: Record<AlertType, { name: keyof typeof Ionicons.glyphMap; color: string } | null> = {
  default: null,
  success: { name: 'checkmark-circle', color: '#34D399' },
  error:   { name: 'alert-circle',     color: '#F87171' },
  warning: { name: 'warning',          color: '#FBBF24' },
  info:    { name: 'information-circle', color: '#7B72F8' },
};

// ── Host (render once at root) ───────────────────────────────────────────────
export function AppAlertHost() {
  const { colors } = useTheme();
  const [opts, setOpts] = useState<AlertOptions | null>(null);
  const backdrop = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const close = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => { setOpts(null); cb?.(); });
  }, [backdrop, scale]);

  useEffect(() => {
    emitter = (next) => setOpts(next);
    return () => { emitter = null; };
  }, []);

  useEffect(() => {
    if (opts) {
      scale.setValue(0.9); backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 260 }),
      ]).start();
    }
  }, [opts, backdrop, scale]);

  // Android hardware back → trigger cancel (or first) button.
  useEffect(() => {
    if (!opts || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const btns = opts.buttons?.length ? opts.buttons : [{ text: 'OK' }];
      const cancel = btns.find(b => b.style === 'cancel') ?? btns[0];
      close(cancel.onPress);
      return true;
    });
    return () => sub.remove();
  }, [opts, close]);

  if (!opts) return null;

  const buttons = opts.buttons?.length ? opts.buttons : [{ text: 'OK' }];
  const stacked = buttons.length > 2;
  const icon = ICONS[opts.type ?? 'default'];

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={() => close()}>
      <Animated.View style={[styles.root, { opacity: backdrop }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 24 : 40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.scrim} />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { /* force a choice */ }} />

        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.bgElevated, borderColor: colors.borderStrong, transform: [{ scale }] },
          ]}
        >
          {/* top accent line */}
          <LinearGradient
            colors={['transparent', '#7B72F8', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.accent}
          />

          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: icon.color + '1A', borderColor: icon.color + '40' }]}>
              <Ionicons name={icon.name} size={30} color={icon.color} />
            </View>
          )}

          <Text style={[styles.title, { color: colors.textPrimary }]}>{opts.title}</Text>
          {!!opts.message && (
            <Text style={[styles.message, { color: colors.textTertiary }]}>{opts.message}</Text>
          )}

          <View style={[styles.actions, stacked ? styles.stacked : styles.row]}>
            {buttons.map((b, i) => {
              const isDestructive = b.style === 'destructive';
              const isCancel = b.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;
              const btnStyle = [styles.btn, stacked ? styles.btnStacked : styles.btnRow];

              if (isPrimary) {
                return (
                  <Pressable key={`${b.text}-${i}`} onPress={() => close(b.onPress)} style={btnStyle}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={['#7B72F8', '#6B63E8']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[styles.btnFill, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={[styles.btnText, { color: '#fff', fontWeight: '700' }]}>{b.text}</Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  onPress={() => close(b.onPress)}
                  style={({ pressed }) => [
                    ...btnStyle,
                    styles.btnOutline,
                    {
                      borderColor: isDestructive ? '#F8717155' : colors.border,
                      backgroundColor: pressed ? colors.bgMuted : 'transparent',
                    },
                  ]}
                >
                  <Text style={[
                    styles.btnText,
                    { color: isDestructive ? '#F87171' : colors.textTertiary, fontWeight: isCancel ? '500' : '700' },
                  ]}>
                    {b.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 14,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.6 },
  iconWrap: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 14,
  },
  title: { fontSize: 18.5, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 4 },
  actions: { marginTop: 24, width: '100%' },
  row: { flexDirection: 'row', gap: 10 },
  stacked: { flexDirection: 'column', gap: 9 },
  btn: { borderRadius: 15, overflow: 'hidden' },
  btnRow: { flex: 1 },
  btnStacked: { width: '100%' },
  btnFill: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  btnText: { fontSize: 15.5 },
});
