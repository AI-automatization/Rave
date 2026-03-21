// CineSync Mobile — StatsScreen
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMyProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/auth.store';
import { useTheme, createThemedStyles, spacing, borderRadius, typography, RANK_COLORS } from '@theme/index';
import { UserRank } from '@app-types/index';
import { useT } from '@i18n/index';

const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const RANK_THRESHOLDS: Record<string, number> = {
  Bronze: 0, Silver: 500, Gold: 2000, Platinum: 5000, Diamond: 10000,
};

function StatItem({ icon, label, value, color }: { icon: string; label: string; value: string | number; color?: string }) {
  const styles = useStyles();

  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
      </View>
    </View>
  );
}

// Bar chart — real weekly activity data
function ActivityChart({ weeklyActivity, emptyText, dayLabels }: { weeklyActivity?: number[]; emptyText: string; dayLabels: string[] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const bars = weeklyActivity ?? Array(7).fill(0);
  const maxVal = Math.max(...bars, 1); // avoid division by zero
  const hasActivity = bars.some((v) => v > 0);

  if (!hasActivity) {
    return (
      <View style={[styles.chart, styles.chartEmpty]}>
        <Ionicons name="bar-chart-outline" size={28} color={colors.textMuted} />
        <Text style={styles.chartEmptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.chart}>
      {bars.map((val, i) => (
        <View key={i} style={styles.barCol}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: `${Math.round((val / maxVal) * 100)}%`,
                  backgroundColor: val > 0 ? colors.primary : colors.bgElevated,
                },
              ]}
            />
          </View>
          <Text style={styles.barDay}>{dayLabels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const TAB_BAR_HEIGHT = 60;

export function StatsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const user = useAuthStore(s => s.user);
  const { statsQuery } = useMyProfile();
  const stats = statsQuery.data;
  const { t, lang } = useT();

  if (statsQuery.isLoading || !stats || !user) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  const DAY_LABELS_MAP: Record<string, string[]> = {
    uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
    ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  };

  const dayLabels = DAY_LABELS_MAP[lang] ?? DAY_LABELS_MAP['en'];

  const rankColor = RANK_COLORS[user.rank];
  const currentRankIdx = RANK_ORDER.indexOf(user.rank);
  const nextRank = RANK_ORDER[currentRankIdx + 1];
  const nextRankMin = nextRank ? RANK_THRESHOLDS[nextRank] : null;
  const pointsToNext = nextRankMin ? Math.max(0, nextRankMin - user.totalPoints) : 0;

  const winRate = stats.battlesTotal > 0 ? Math.round((stats.battlesWon / stats.battlesTotal) * 100) : 0;

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('stats', 'title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Rank card */}
      <View style={[styles.rankCard, { borderColor: rankColor }]}>
        <View style={styles.rankRow}>
          <View style={[styles.rankBadge, { backgroundColor: rankColor + '22' }]}>
            <Text style={[styles.rankName, { color: rankColor }]}>{user.rank}</Text>
          </View>
          <View style={styles.rankPoints}>
            <Text style={styles.pointsValue}>{user.totalPoints}</Text>
            <Text style={styles.pointsLabel}>{t('profile', 'points')}</Text>
          </View>
        </View>
        {nextRank && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${stats.rankProgress}%`,
                    backgroundColor: rankColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {pointsToNext} {t('profile', 'points')} \u2192 {nextRank}
            </Text>
          </View>
        )}
      </View>

      {/* 6 stat cards */}
      <View style={styles.statsGrid}>
        <StatItem icon="🎬" label={t('stats', 'films')} value={stats.totalWatched} />
        <StatItem icon="⏱" label={t('stats', 'hours')} value={`${Math.round(stats.totalMinutes / 60)}${t('stats', 'hours')}`} />
        <StatItem icon="⚔️" label={t('stats', 'battles')} value={stats.battlesTotal} />
        <StatItem icon="🏆" label={t('stats', 'victories')} value={stats.battlesWon} color={colors.gold} />
        <StatItem icon="📊" label={t('stats', 'winRate')} value={`${winRate}%`} color={winRate >= 50 ? colors.success : colors.error} />
        <StatItem icon="🔥" label={t('stats', 'streak')} value={`${stats.currentStreak} ${t('stats', 'days')}`} color={colors.warning} />
      </View>

      {/* Activity chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stats', 'weeklyActivity').toUpperCase()}</Text>
        <ActivityChart
          weeklyActivity={stats.weeklyActivity}
          emptyText={t('stats', 'noActivity')}
          dayLabels={dayLabels}
        />
      </View>

      {/* Rank yo'li */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stats', 'rankPath')}</Text>
        <View style={styles.rankPath}>
          {RANK_ORDER.map((rank, i) => {
            const rankKey = rank as UserRank;
            const isReached = RANK_ORDER.indexOf(user.rank) >= i;
            const isCurrent = user.rank === rankKey;
            return (
              <View key={rank} style={styles.rankStep}>
                <View
                  style={[
                    styles.rankNode,
                    { borderColor: RANK_COLORS[rankKey] },
                    isReached && { backgroundColor: RANK_COLORS[rankKey] },
                    isCurrent && styles.rankNodeCurrent,
                  ]}
                >
                  {isCurrent && <View style={[styles.rankNodeInner, { backgroundColor: colors.bgBase }]} />}
                </View>
                <Text style={[styles.rankNodeLabel, isCurrent && { color: RANK_COLORS[rankKey] }]}>{rank}</Text>
                {i < RANK_ORDER.length - 1 && (
                  <View style={[styles.rankLine, isReached && { backgroundColor: RANK_COLORS[rankKey] }]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
    </ScrollView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  loader: { flex: 1, marginTop: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  rankCard: {
    margin: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  rankName: { ...typography.h3, fontWeight: '700', color: colors.textPrimary },
  rankPoints: { alignItems: 'flex-end' },
  pointsValue: { ...typography.h2, color: colors.textPrimary },
  pointsLabel: { ...typography.caption, color: colors.textMuted },
  progressWrap: { gap: spacing.xs },
  progressTrack: { height: 6, backgroundColor: colors.bgElevated, borderRadius: borderRadius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  progressText: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  statsGrid: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  statIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  statContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { ...typography.body, color: colors.textSecondary },
  statValue: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  section: { margin: spacing.lg, gap: spacing.md },
  sectionTitle: { ...typography.label, color: colors.textMuted },
  chart: {
    flexDirection: 'row',
    height: 80,
    gap: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  chartEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  chartEmptyText: { ...typography.caption, color: colors.textMuted },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3, minHeight: 4 },
  barDay: { fontSize: 9, color: colors.textMuted },
  rankPath: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankStep: { alignItems: 'center', flex: 1, gap: 4, position: 'relative' },
  rankNode: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rankNodeCurrent: { width: 20, height: 20, borderRadius: 10, borderWidth: 3 },
  rankNodeInner: { width: 8, height: 8, borderRadius: 4 },
  rankNodeLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  rankLine: {
    position: 'absolute',
    top: 8,
    right: '-50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.bgElevated,
    zIndex: -1,
  },
}));
