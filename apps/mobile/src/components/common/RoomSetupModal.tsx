// WeWatch Mobile — "Xona sozlamalari": nom + ochiq/yopiq tanlovi xona ochishdan oldin (veb CreateRoomDialog bilan bir xil).
// Imperative API (AppAlert kabi): const s = await askRoomSetup('Film nomi'); s === null → bekor qilindi.
// <RoomSetupHost /> AppAlertHost yonida mount qilinadi (iOS native modal ustida ko'rinishi uchun ikkala navigatorda ham).
import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, Switch, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '@i18n/index';
import { useTheme } from '@theme/index';

export interface RoomSetup {
  name: string;
  isPrivate: boolean;
}

interface Request {
  defaultName: string;
  resolve: (value: RoomSetup | null) => void;
}

const emitters: Array<(req: Request) => void> = [];

/** Foydalanuvchidan xona nomi va ochiq/yopiq holatini so'raydi. Bekor qilinsa null qaytaradi. */
export function askRoomSetup(defaultName: string): Promise<RoomSetup | null> {
  return new Promise((resolve) => {
    const emit = emitters[emitters.length - 1];
    if (!emit) {
      if (__DEV__) console.warn('[RoomSetup] host not mounted — default (ochiq) ishlatildi');
      resolve({ name: defaultName, isPrivate: false });
      return;
    }
    emit({ defaultName, resolve });
  });
}

export function RoomSetupHost() {
  const { colors } = useTheme();
  const { t } = useT();
  const [req, setReq] = useState<Request | null>(null);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const emit = (next: Request) => {
      setName(next.defaultName.slice(0, 50));
      setIsPrivate(false);
      setReq(next);
    };
    emitters.push(emit);
    return () => {
      const i = emitters.indexOf(emit);
      if (i >= 0) emitters.splice(i, 1);
    };
  }, []);

  if (!req) return null;

  const finish = (value: RoomSetup | null) => {
    req.resolve(value);
    setReq(null);
  };
  const submit = () => finish({ name: name.trim() || req.defaultName, isPrivate });

  return (
    <Modal transparent visible statusBarTranslucent animationType="fade" onRequestClose={() => finish(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => finish(null)} />
        <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderStrong }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('watchParty', 'createRoom')}</Text>

          <Text style={[styles.label, { color: colors.textTertiary }]}>{t('watchParty', 'roomNameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={50}
            placeholder={t('watchParty', 'roomNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bgMuted }]}
          />

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <Ionicons name={isPrivate ? 'lock-closed' : 'globe-outline'} size={20} color={colors.primary} />
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                {isPrivate ? t('watchParty', 'private') : t('watchParty', 'public')}
              </Text>
              <Text style={[styles.toggleSub, { color: colors.textTertiary }]}>
                {isPrivate ? t('watchParty', 'privateDesc') : t('watchParty', 'publicDesc')}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.bgMuted, true: colors.primary + '80' }}
              thumbColor={isPrivate ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => finish(null)} style={[styles.btn, styles.btnCancel, { borderColor: colors.border }]}>
              <Text style={[styles.btnText, { color: colors.textTertiary }]}>{t('common', 'cancel')}</Text>
            </Pressable>
            <Pressable onPress={submit} style={[styles.btn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.btnText, { color: '#fff', fontWeight: '700' }]}>{t('watchParty', 'createRoom')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.55)' },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 14 },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12.5, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1 },
  btnText: { fontSize: 15 },
});
