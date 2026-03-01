import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { formatDistanceToNow, isPast } from 'date-fns';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { battleApi, LeaderboardEntry } from '@api/battle.api';
import { useAuthStore } from '@store/auth.store';
import type { RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'Battle'>;

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export default function BattleScreen({ navigation, route }: Props) {
  const { battleId } = route.params;
  const userId = useAuthStore((s) => s.user?._id);
  const qc = useQueryClient();

  const { data: battle, isLoading: battleLoading } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      const res = await battleApi.getBattle(battleId);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ['battle', battleId, 'leaderboard'],
    queryFn: async () => {
      const res = await battleApi.getLeaderboard(battleId);
      return res.data ?? [];
    },
    staleTime: 30 * 1000,
    // BUG-M022: faqat active battle da refetch — tugallangan/bekor qilinganda keraksiz API chaqiruv yo'q
    refetchInterval: battle?.status === 'active' ? 60 * 1000 : false,
  });

  const handleAccept = async () => {
    try {
      await battleApi.acceptBattle(battleId);
      qc.invalidateQueries({ queryKey: ['battle', battleId] });
      Toast.show({ type: 'success', text1: "Battle qabul qilindi!" });
    } catch {
      Toast.show({ type: 'error', text1: 'Xatolik yuz berdi' });
    }
  };

  const handleInvite = async (friendId: string) => {
    try {
      await battleApi.inviteParticipant(battleId, friendId);
      Toast.show({ type: 'success', text1: "Taklif yuborildi!" });
    } catch {
      Toast.show({ type: 'error', text1: 'Xatolik yuz berdi' });
    }
  };

  if (battleLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!battle) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Battle topilmadi</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const myParticipation = battle.participants.find((p) => p.userId === userId);
  const isPending = myParticipation?.status === 'pending';
  const isEnded = battle.status === 'completed' || battle.status === 'cancelled';
  const isWinner = battle.winnerId === userId;
  const maxScore = Math.max(...leaderboard.map((e) => e.score), 1);

  const timeLeft = isPast(new Date(battle.endDate))
    ? 'Tugadi'
    : formatDistanceToNow(new Date(battle.endDate), { addSuffix: true });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{battle.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Result banner (if ended) */}
        {isEnded && (
          <View style={[styles.resultBanner, isWinner ? styles.winBanner : styles.loseBanner]}>
            <Text style={styles.resultEmoji}>{isWinner ? '🏆' : '😔'}</Text>
            <Text style={styles.resultText}>
              {isWinner ? "Tabriklaymiz! G'olib bo'ldingiz!" : "Keyingisida baxtingiz kulib boqsin!"}
            </Text>
          </View>
        )}

        {/* Battle info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, battle.status === 'active' && styles.statusActive]}>
              <Text style={styles.statusText}>{battle.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Davomiylik</Text>
            <Text style={styles.infoValue}>{battle.duration} kun</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vaqt</Text>
            <Text style={[styles.infoValue, isEnded && { color: colors.error }]}>{timeLeft}</Text>
          </View>
        </View>

        {/* Accept button (if pending) */}
        {isPending && (
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <Text style={styles.acceptBtnText}>Battle qabul qilish ⚔️</Text>
          </TouchableOpacity>
        )}

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Reyting</Text>
        {lbLoading ? (
          <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
        ) : (
          leaderboard.map((entry, index) => (
            <View
              key={entry.userId}
              style={[styles.leaderRow, entry.userId === userId && styles.myRow]}
            >
              <Text style={styles.rank}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </Text>
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>
                  {entry.username} {entry.userId === userId ? '(Men)' : ''}
                </Text>
                <ProgressBar value={entry.score} max={maxScore} />
                <Text style={styles.leaderStats}>
                  {entry.moviesWatched} film · {Math.floor(entry.minutesWatched / 60)}s ko'rildi
                </Text>
              </View>
              <Text style={styles.leaderScore}>{entry.score} pt</Text>
            </View>
          ))
        )}

        {leaderboard.length === 0 && !lbLoading && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Hali hech kim ko'rmagan 😴</Text>
          </View>
        )}

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.textSecondary, fontSize: typography.sizes.md, width: 60 },
  headerTitle: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, flex: 1, textAlign: 'center' },
  resultBanner: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  winBanner: { backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: colors.gold },
  loseBanner: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border },
  resultEmoji: { fontSize: 48 },
  resultText: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, textAlign: 'center' },
  infoCard: {
    margin: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  infoValue: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  statusBadge: {
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusActive: { borderColor: colors.success, backgroundColor: 'rgba(34,197,94,0.1)' },
  statusText: { color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  acceptBtn: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  acceptBtnText: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  myRow: { backgroundColor: 'rgba(229,9,20,0.05)' },
  rank: { fontSize: 20, width: 32, textAlign: 'center' },
  leaderInfo: { flex: 1, gap: 4 },
  leaderName: { color: colors.textPrimary, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  leaderStats: { color: colors.textMuted, fontSize: typography.sizes.xs },
  leaderScore: { color: colors.gold, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, minWidth: 60, textAlign: 'right' },
  progressBg: { height: 4, backgroundColor: colors.bgOverlay, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  errorText: { color: colors.textSecondary, fontSize: typography.sizes.lg },
  emptyText: { color: colors.textMuted, fontSize: typography.sizes.md },
});
