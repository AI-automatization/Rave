// CineSync Mobile — ProfileScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMyProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/auth.store';
import { colors, spacing, borderRadius, typography, RANK_COLORS } from '@theme/index';
import { ProfileStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import type { UserRank } from '@app-types/index';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const RANK_ORDER: UserRank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const RANK_THRESHOLDS: Record<UserRank, [number, number]> = {
  Bronze:   [0, 499],
  Silver:   [500, 1999],
  Gold:     [2000, 4999],
  Platinum: [5000, 9999],
  Diamond:  [10000, 99999],
};

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { profileQuery, statsQuery, updateProfileMutation } = useMyProfile();
  const stats = statsQuery.data;
  const { t } = useT();

  const [editVisible, setEditVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  const handleLogout = () => {
    Alert.alert(t('profile', 'logoutTitle'), t('profile', 'logoutMsg'), [
      { text: t('common', 'cancel'), style: 'cancel' },
      { text: t('profile', 'logoutBtn'), style: 'destructive', onPress: logout },
    ]);
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfileMutation.mutate({ avatar: result.assets[0].uri });
    }
  };

  const openEditModal = () => {
    setEditUsername(user?.username ?? '');
    setEditBio(user?.bio ?? '');
    setEditVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editUsername.trim()) return;
    updateProfileMutation.mutate(
      { username: editUsername.trim(), bio: editBio.trim() },
      { onSuccess: () => setEditVisible(false) },
    );
  };

  if (!user) return <ActivityIndicator style={styles.loader} color={colors.primary} />;

  const rank = user.rank ?? 'Bronze';
  const rankColor = RANK_COLORS[rank] ?? colors.textMuted;
  const [rankMin, rankMax] = RANK_THRESHOLDS[rank] ?? [0, 1];
  const totalPts = user.totalPoints ?? 0;
  const rankProgress = rankMax > rankMin
    ? Math.min(((totalPts - rankMin) / (rankMax - rankMin)) * 100, 100)
    : 0;
  const rankIdx = RANK_ORDER.indexOf(rank);
  const nextRank = rankIdx < RANK_ORDER.length - 1 ? RANK_ORDER[rankIdx + 1] : null;

  return (
    <>
      <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.title}>{t('profile', 'title')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Avatar + edit overlay */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8}>
            <Image
              source={user.avatar ? { uri: user.avatar } : require('../../../assets/icon.png')}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.avatarEditOverlay}>
              <Ionicons name="camera" size={14} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={openEditModal} activeOpacity={0.8} style={styles.usernameRow}>
            <Text style={styles.username}>{user.username}</Text>
            <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Online status */}
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: user.isOnline === true ? colors.success : colors.textDim }]} />
            <Text style={[styles.onlineText, { color: user.isOnline === true ? colors.success : colors.textMuted }]}>
              {user.isOnline === true ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.rankBadge}>
            <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
            <Text style={styles.rankPts}>{totalPts} {t('profile', 'points')}</Text>
          </View>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {/* Rank progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{totalPts} {t('profile', 'points')}</Text>
              <Text style={styles.progressLabel}>{rankMax} {t('profile', 'points')}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${rankProgress}%`, backgroundColor: rankColor }]} />
            </View>
            {nextRank ? (
              <Text style={styles.progressSub}>{rank} → {nextRank}</Text>
            ) : (
              <Text style={[styles.progressSub, { color: rankColor }]}>MAX RANK</Text>
            )}
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('profile', 'stats')}</Text>
          {stats ? (
            <View style={styles.statsGrid}>
              <StatCard icon="🎬" value={stats.totalWatched ?? 0} label={t('profile', 'movies')} />
              <StatCard icon="⏱" value={`${Math.round((stats.totalMinutes ?? 0) / 60)}h`} label={t('profile', 'hours')} />
              <StatCard icon="⚔️" value={stats.battlesWon ?? 0} label={t('profile', 'wins')} />
              <StatCard icon="🏅" value={stats.achievementsCount ?? 0} label={t('profile', 'badges')} />
            </View>
          ) : statsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard icon="🎬" value={0} label={t('profile', 'movies')} />
              <StatCard icon="⏱" value="0h" label={t('profile', 'hours')} />
              <StatCard icon="⚔️" value={0} label={t('profile', 'wins')} />
              <StatCard icon="🏅" value={0} label={t('profile', 'badges')} />
            </View>
          )}
        </View>

        {/* Account info */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>{t('profile', 'accountInfo')}</Text>
          <View style={styles.accountCard}>
            <InfoRow icon="mail-outline" label="Email" value={user.email ?? '—'} />
            <View style={styles.infoDivider} />
            <InfoRow icon="shield-checkmark-outline" label={t('profile', 'role')} value={user.role ?? '—'} />
            <View style={styles.infoDivider} />
            <InfoRow icon="calendar-outline" label={t('profile', 'joined')} value={formatDate(user.createdAt)} />
            <View style={styles.infoDivider} />
            <InfoRow icon="time-outline" label={t('profile', 'lastLogin')} value={formatDate(user.lastLoginAt)} />
            {stats?.friendsCount !== undefined && (
              <>
                <View style={styles.infoDivider} />
                <InfoRow icon="people-outline" label={t('profile', 'friends')} value={String(stats.friendsCount)} />
              </>
            )}
            {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
              <>
                <View style={styles.infoDivider} />
                <InfoRow icon="flame-outline" label={t('profile', 'streak')} value={`${stats.currentStreak} ${t('stats', 'days')}`} />
              </>
            )}
          </View>
        </View>

        {/* Navigation links */}
        <View style={styles.navLinks}>
          {([
            { icon: 'bar-chart-outline', label: t('profile', 'stats'), screen: 'Stats' },
            { icon: 'ribbon-outline', label: t('profile', 'achievements'), screen: 'Achievements' },
          ] as const).map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.navLink}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <Ionicons name={item.icon} size={20} color={colors.secondary} />
              <Text style={styles.navLinkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('profile', 'logoutBtn')}</Text>
        </TouchableOpacity>

        {profileQuery.isFetching && <ActivityIndicator style={styles.refreshIndicator} color={colors.primary} size="small" />}
        <View style={{ height: 60 + insets.bottom + spacing.lg }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('profile', 'editProfile')}</Text>

            <Text style={styles.inputLabel}>{t('profile', 'username')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>{t('profile', 'bio')}</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              value={editBio}
              onChangeText={(txt) => setEditBio(txt.slice(0, 200))}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.cancelText}>{t('common', 'cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, updateProfileMutation.isPending && styles.btnDisabled]}
                onPress={handleSaveEdit}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Text style={styles.saveText}>{t('common', 'save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  title: { ...typography.h1, color: colors.textPrimary },
  settingsBtn: { padding: spacing.xs },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: borderRadius.full },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgBase,
  },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  username: { ...typography.h2, color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { ...typography.caption, fontWeight: '600' },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankDot: { width: 10, height: 10, borderRadius: 5 },
  rankText: { ...typography.body, fontWeight: '700' },
  rankPts: { ...typography.caption, color: colors.textMuted },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  progressWrap: { width: '100%', gap: spacing.xs, marginTop: spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...typography.caption, color: colors.textMuted },
  progressTrack: { height: 8, backgroundColor: colors.bgElevated, borderRadius: borderRadius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  progressSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  statsSection: { padding: spacing.lg },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.bgSurface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  statIcon: { fontSize: 22 },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  accountSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  accountCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoLabel: { ...typography.caption, color: colors.textMuted, width: 90 },
  infoValue: { ...typography.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  infoDivider: { height: 1, backgroundColor: colors.border },
  navLinks: { marginHorizontal: spacing.lg, gap: spacing.sm },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  navLinkText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '55',
  },
  logoutText: { ...typography.body, color: colors.error },
  refreshIndicator: { marginTop: spacing.md },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  inputLabel: { ...typography.label, color: colors.textMuted },
  modalInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalInputMulti: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
});
