import React, { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography, RANK_COLORS } from '@theme/index';
import { userApi } from '@api/user.api';
import type { ProfileStackParams } from '@navigation/types';
import type { UserRank } from '@types/index';

type Props = NativeStackScreenProps<ProfileStackParams, 'Stats'>;

const RANK_ORDER: UserRank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const RANK_MILESTONES: Record<UserRank, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 2000,
  Platinum: 5000,
  Diamond: 10000,
};

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

const StatCard = memo(({ label, value, sub, accent }: StatCardProps) => (
  <View style={[styles.statCard, accent ? { borderColor: accent } : undefined]}>
    <Text style={[styles.statValue, accent ? { color: accent } : undefined]}>{value}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

interface BarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const StatBar = memo(({ label, value, maxValue, color }: BarProps) => {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
});

export default function StatsScreen({ navigation }: Props) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => {
      const res = await userApi.getMyStats();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rankColor = stats ? (RANK_COLORS[stats.rank] ?? colors.textPrimary) : colors.textPrimary;
  const rankIndex = stats ? RANK_ORDER.indexOf(stats.rank) : 0;
  const nextRank = rankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[rankIndex + 1] : null;
  const nextMilestone = nextRank ? RANK_MILESTONES[nextRank] : stats?.nextMilestone ?? 0;
  const currentMilestone = stats ? RANK_MILESTONES[stats.rank] : 0;
  const progressInRank = stats
    ? Math.max(0, stats.totalPoints - currentMilestone)
    : 0;
  const rangeInRank = Math.max(1, nextMilestone - currentMilestone);
  const rankPct = Math.min((progressInRank / rangeInRank) * 100, 100);

  const hours = stats ? Math.floor(stats.minutesWatched / 60) : 0;
  const mins = stats ? stats.minutesWatched % 60 : 0;

  const maxBar = stats
    ? Math.max(stats.moviesWatched, stats.battlesWon, stats.watchParties, stats.achievementsUnlocked, 1)
    : 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statistika</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading || !stats ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Rank card */}
          <View style={[styles.rankCard, { borderColor: rankColor }]}>
            <View style={styles.rankRow}>
              <View>
                <Text style={styles.rankLabel}>Joriy daraja</Text>
                <Text style={[styles.rankName, { color: rankColor }]}>● {stats.rank}</Text>
              </View>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsVal}>{stats.totalPoints.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>jami ball</Text>
              </View>
            </View>
            {nextRank && (
              <>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{stats.rank} → {nextRank}</Text>
                  <Text style={[styles.progressPct, { color: rankColor }]}>
                    {Math.round(rankPct)}%
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${rankPct}%`, backgroundColor: rankColor }]} />
                </View>
                <Text style={styles.progressSub}>
                  {Math.max(0, nextMilestone - stats.totalPoints).toLocaleString()} ball qoldi
                </Text>
              </>
            )}
            {!nextRank && (
              <Text style={[styles.maxRank, { color: rankColor }]}>Maksimal darajaga yetdingiz! 🏆</Text>
            )}
          </View>

          {/* Key stats grid */}
          <Text style={styles.sectionTitle}>Asosiy ko'rsatkichlar</Text>
          <View style={styles.grid}>
            <StatCard
              label="Film ko'rildi"
              value={String(stats.moviesWatched)}
              accent={colors.primary}
            />
            <StatCard
              label="Tomosha vaqti"
              value={`${hours}s`}
              sub={`${mins} daqiqa`}
              accent={colors.diamond}
            />
            <StatCard
              label="Battle g'alabalar"
              value={String(stats.battlesWon)}
              accent={colors.gold}
            />
            <StatCard
              label="Watch Party"
              value={String(stats.watchParties)}
              accent={colors.success}
            />
            <StatCard
              label="Yutuqlar"
              value={String(stats.achievementsUnlocked)}
              accent={colors.warning}
            />
            <StatCard
              label="Daraja"
              value={String(stats.level)}
              sub="level"
              accent={rankColor}
            />
          </View>

          {/* Activity bars */}
          <Text style={styles.sectionTitle}>Faollik</Text>
          <View style={styles.barsCard}>
            <StatBar
              label="Filmlar"
              value={stats.moviesWatched}
              maxValue={maxBar}
              color={colors.primary}
            />
            <StatBar
              label="Battlelar"
              value={stats.battlesWon}
              maxValue={maxBar}
              color={colors.gold}
            />
            <StatBar
              label="Watch Party"
              value={stats.watchParties}
              maxValue={maxBar}
              color={colors.success}
            />
            <StatBar
              label="Yutuqlar"
              value={stats.achievementsUnlocked}
              maxValue={maxBar}
              color={colors.warning}
            />
          </View>

          {/* All ranks */}
          <Text style={styles.sectionTitle}>Daraja yo'li</Text>
          <View style={styles.ranksCard}>
            {RANK_ORDER.map((rank, idx) => {
              const isReached = rankIndex >= idx;
              const isCurrent = rank === stats.rank;
              const rColor = RANK_COLORS[rank] ?? colors.textMuted;
              return (
                <View key={rank} style={styles.rankItem}>
                  <View style={[styles.rankDot, { backgroundColor: isReached ? rColor : colors.bgOverlay, borderColor: rColor }]} />
                  {idx < RANK_ORDER.length - 1 && (
                    <View style={[styles.rankLine, { backgroundColor: isReached && rankIndex > idx ? rColor : colors.bgOverlay }]} />
                  )}
                  <Text style={[styles.rankItemName, { color: isReached ? rColor : colors.textMuted }]}>
                    {rank} {isCurrent ? '← hozir' : ''}
                  </Text>
                  <Text style={styles.rankItemPts}>{RANK_MILESTONES[rank].toLocaleString()} pt</Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: spacing.xxxl * 2 }} />
        </ScrollView>
      )}
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
  back: { color: colors.textSecondary, fontSize: typography.sizes.md, width: 60 },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg },

  // Rank card
  rankCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rankLabel: { color: colors.textMuted, fontSize: typography.sizes.xs, marginBottom: 2 },
  rankName: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  pointsBox: { alignItems: 'flex-end' },
  pointsVal: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pointsLabel: { fontSize: typography.sizes.xs, color: colors.textMuted },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  progressPct: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  progressBg: { height: 8, backgroundColor: colors.bgOverlay, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: typography.sizes.xs, color: colors.textMuted, textAlign: 'right' },
  maxRank: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, textAlign: 'center' },

  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Stats grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statSub: { fontSize: typography.sizes.xs, color: colors.textMuted },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textMuted, textAlign: 'center' },

  // Bars
  barsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm, width: 72 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgOverlay,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { color: colors.textPrimary, fontSize: typography.sizes.sm, width: 32, textAlign: 'right' },

  // Rank timeline
  ranksCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  rankItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  rankDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  rankLine: {
    position: 'absolute',
    left: 6,
    top: 16,
    width: 2,
    height: spacing.lg + spacing.sm,
  },
  rankItemName: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  rankItemPts: { fontSize: typography.sizes.sm, color: colors.textMuted },
});
