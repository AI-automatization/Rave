import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { battleApi } from '@api/battle.api';
import { useBattleStore } from '@store/battle.store';
import type { RootStackParams } from '@navigation/types';
import type { BattleDuration } from '@types/index';

type Props = NativeStackScreenProps<RootStackParams, 'BattleCreate'>;
type RootNav = NativeStackNavigationProp<RootStackParams>;

const DURATIONS: { value: BattleDuration; label: string; emoji: string }[] = [
  { value: 3, label: '3 kun', emoji: '⚡' },
  { value: 5, label: '5 kun', emoji: '🔥' },
  { value: 7, label: '7 kun', emoji: '👑' },
];

export default function BattleCreateScreen({ navigation }: Props) {
  const rootNav = useNavigation<RootNav>();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<BattleDuration>(5);
  const [loading, setLoading] = useState(false);
  const { addBattle } = useBattleStore();

  const handleCreate = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: "Battle nomini kiriting" });
      return;
    }

    setLoading(true);
    try {
      const res = await battleApi.createBattle(title.trim(), duration);
      if (res.success && res.data) {
        addBattle(res.data);
        navigation.goBack();
        rootNav.navigate('Battle', { battleId: res.data._id });
      } else {
        Toast.show({ type: 'error', text1: res.message || 'Xatolik' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Tarmoq xatosi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Bekor qilish</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle yaratish</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>⚔️</Text>
        <Text style={styles.subtitle}>Kim ko'proq film ko'radi?</Text>

        {/* Title input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Battle nomi</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: Haftalik challenge"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </View>

        {/* Duration selector */}
        <Text style={styles.label}>Davomiylik</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.durationCard, duration === d.value && styles.durationCardActive]}
              onPress={() => setDuration(d.value)}
            >
              <Text style={styles.durationEmoji}>{d.emoji}</Text>
              <Text style={[styles.durationLabel, duration === d.value && styles.durationLabelActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.createBtnText}>Battle boshlash ⚔️</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: { color: colors.textSecondary, fontSize: typography.sizes.md },
  headerTitle: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  content: { padding: spacing.lg, alignItems: 'center', gap: spacing.xl },
  emoji: { fontSize: 64 },
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.md },
  inputGroup: { width: '100%', gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, alignSelf: 'flex-start' },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    width: '100%',
  },
  durationRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  durationCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  durationCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(229,9,20,0.1)' },
  durationEmoji: { fontSize: 28 },
  durationLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  durationLabelActive: { color: colors.primary, fontWeight: typography.weights.bold },
  createBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
