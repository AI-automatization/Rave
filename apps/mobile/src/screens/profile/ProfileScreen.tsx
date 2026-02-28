import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography, RANK_COLORS } from '@theme/index';
import { useAuthStore } from '@store/auth.store';
import { userApi } from '@api/user.api';
import { authApi } from '@api/auth.api';
import { tokenStorage } from '@utils/storage';
import type { ProfileStackParams, RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<ProfileStackParams, 'Profile'>;
type RootNav = NativeStackNavigationProp<RootStackParams>;

export default function ProfileScreen({ navigation }: Props) {
  const rootNav = useNavigation<RootNav>();
  const { user, logout } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => {
      const res = await userApi.getMyStats();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // silent
    } finally {
      logout();
    }
  };

  const rankColor = RANK_COLORS[user?.rank ?? 'Bronze'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + info */}
        <View style={styles.profileSection}>
          {user?.avatar ? (
            <FastImage
              style={styles.avatar}
              source={{ uri: user.avatar, priority: FastImage.priority.high }}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.username}>{user?.username}</Text>
          <View style={styles.rankBadge}>
            <Text style={[styles.rankText, { color: rankColor }]}>● {user?.rank}</Text>
          </View>
          {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats cards */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
        ) : stats ? (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalPoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Jami ball</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.moviesWatched}</Text>
              <Text style={styles.statLabel}>Film ko'rildi</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.floor(stats.minutesWatched / 60)}s</Text>
              <Text style={styles.statLabel}>Umumiy vaqt</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.battlesWon}</Text>
              <Text style={styles.statLabel}>Battle g'alabalar</Text>
            </View>
          </View>
        ) : null}

        {/* Progress to next rank */}
        {stats && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Keyingi darajaga</Text>
              <Text style={styles.progressPts}>{Math.max(0, stats.nextMilestone - stats.totalPoints)} pt</Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${stats.nextMilestone > 0 ? Math.min((stats.totalPoints / stats.nextMilestone) * 100, 100) : 100}%`,
                    backgroundColor: rankColor,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.navButtons}>
          {[
            { label: '📊 Statistika', screen: 'Stats' as const },
            { label: '🏆 Yutuqlar', screen: 'Achievements' as const },
            { label: '⚙️ Sozlamalar', screen: 'Settings' as const },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.screen}
              style={styles.navBtn}
              onPress={() => navigation.navigate(btn.screen)}
            >
              <Text style={styles.navBtnText}>{btn.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  settingsIcon: { fontSize: 22, padding: spacing.sm },
  profileSection: { alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.sm },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  avatarInitial: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.primary },
  username: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  rankBadge: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  bio: { color: colors.textSecondary, fontSize: typography.sizes.md, textAlign: 'center' },
  email: { color: colors.textMuted, fontSize: typography.sizes.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  progressCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  progressPts: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  progressBg: { height: 6, backgroundColor: colors.bgOverlay, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  navButtons: { marginHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  navBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnText: { color: colors.textPrimary, fontSize: typography.sizes.md },
  chevron: { color: colors.textMuted, fontSize: 20, fontWeight: typography.weights.bold },
  logoutBtn: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  logoutText: { color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
