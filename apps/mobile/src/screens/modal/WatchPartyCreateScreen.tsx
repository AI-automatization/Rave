import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { watchPartyApi } from '@api/watchParty.api';
import { useWatchPartyStore } from '@store/watchParty.store';
import { connectSocket, watchPartySocket } from '@socket/client';
import type { RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'WatchPartyCreate'>;
type RootNav = NativeStackNavigationProp<RootStackParams>;

const MAX_MEMBERS = [2, 4, 6, 8, 10];

export default function WatchPartyCreateScreen({ navigation, route }: Props) {
  const { movieId } = route.params;
  const rootNav = useNavigation<RootNav>();
  const [isPrivate, setIsPrivate] = useState(true);
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);
  const { setRoom } = useWatchPartyStore();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await watchPartyApi.createRoom(movieId, isPrivate, maxMembers);
      if (res.success && res.data) {
        setRoom(res.data);
        connectSocket();
        watchPartySocket.joinRoom(res.data._id);
        // BUG-M009: navigate avval stack ga qo'shadi, keyin goBack — race condition oldini olish
        rootNav.navigate('WatchParty', { roomId: res.data._id });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: res.message || 'Xona yaratishda xatolik' });
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
        <Text style={styles.title}>Watch Party yaratish</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🎬</Text>
        <Text style={styles.subtitle}>Do'stlar bilan birga film ko'ring</Text>

        {/* Private toggle */}
        <View style={styles.option}>
          <View>
            <Text style={styles.optionLabel}>Xususiy xona</Text>
            <Text style={styles.optionDesc}>Faqat taklif qilinganlar kirishi mumkin</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ true: colors.primary, false: colors.bgSurface }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {/* Max members */}
        <Text style={styles.optionLabel}>Maksimal a'zolar soni</Text>
        <View style={styles.membersRow}>
          {MAX_MEMBERS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.memberChip, maxMembers === n && styles.memberChipActive]}
              onPress={() => setMaxMembers(n)}
            >
              <Text style={[styles.memberChipText, maxMembers === n && styles.memberChipTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.createBtnText}>Xona yaratish 🚀</Text>
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
  title: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  content: { padding: spacing.lg, alignItems: 'center', gap: spacing.lg },
  emoji: { fontSize: 64 },
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.md, textAlign: 'center' },
  option: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLabel: { color: colors.textPrimary, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  optionDesc: { color: colors.textMuted, fontSize: typography.sizes.sm, marginTop: 2 },
  membersRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  memberChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberChipText: { color: colors.textSecondary, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
  memberChipTextActive: { color: colors.textPrimary },
  createBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
