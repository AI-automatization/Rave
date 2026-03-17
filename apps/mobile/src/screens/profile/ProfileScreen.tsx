// CineSync Mobile — ProfileScreen (animated)
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useMyProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/auth.store';
import { colors, spacing, borderRadius, typography, RANK_COLORS } from '@theme/index';
import { ProfileStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import type { UserRank } from '@app-types/index';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const { width: SCREEN_W } = Dimensions.get('window');
const RANK_ORDER: UserRank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const RANK_THRESHOLDS: Record<UserRank, [number, number]> = {
  Bronze:   [0, 499],
  Silver:   [500, 1999],
  Gold:     [2000, 4999],
  Platinum: [5000, 9999],
  Diamond:  [10000, 99999],
};
const RANK_IONICONS: Record<UserRank, keyof typeof Ionicons.glyphMap> = {
  Bronze: 'shield-outline',
  Silver: 'shield-half-outline',
  Gold: 'shield',
  Platinum: 'diamond-outline',
  Diamond: 'trophy',
};

// ─── Animated components ─────────────────────────────────────

function FadeInView({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: object }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function AnimatedProgressBar({ progress, color, delay = 300 }: { progress: number; color: string; delay?: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(width, { toValue: progress, duration: 800, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, delay, width]);

  return (
    <View style={s.progressTrack}>
      <Animated.View
        style={[
          s.progressFill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

function PulsingDot({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [active, scale]);

  return (
    <View style={s.onlineDotWrap}>
      {active && (
        <Animated.View
          style={[s.onlinePulse, { backgroundColor: colors.success + '40', transform: [{ scale }] }]}
        />
      )}
      <View style={[s.onlineDot, { backgroundColor: active ? colors.success : colors.textDim }]} />
    </View>
  );
}

function StatCard({ icon, value, label, delay = 0, iconColor }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string; delay?: number; iconColor?: string }) {
  return (
    <FadeInView delay={delay} style={s.statCard}>
      <Ionicons name={icon} size={24} color={iconColor ?? colors.primary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </FadeInView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function NavItem({ icon, label, onPress, delay = 0 }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; delay?: number }) {
  return (
    <FadeInView delay={delay}>
      <TouchableOpacity style={s.navLink} onPress={onPress} activeOpacity={0.7}>
        <View style={s.navIconWrap}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={s.navLinkText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </TouchableOpacity>
    </FadeInView>
  );
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Main ─────────────────────────────────────────────────────

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

  // Avatar scale animation on press
  const avatarScale = useRef(new Animated.Value(1)).current;

  const handleLogout = () => {
    Alert.alert(t('profile', 'logoutTitle'), t('profile', 'logoutMsg'), [
      { text: t('common', 'cancel'), style: 'cancel' },
      { text: t('profile', 'logoutBtn'), style: 'destructive', onPress: logout },
    ]);
  };

  const handlePickAvatar = async () => {
    Animated.sequence([
      Animated.timing(avatarScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(avatarScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

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

  const displayUser = profileQuery.data ?? user;

  if (!displayUser) {
    if (profileQuery.isLoading) {
      return (
        <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={s.emptyIcon}>
          <Ionicons name="person-outline" size={40} color={colors.textDim} />
        </View>
        <Text style={s.emptyText}>{t('profile', 'title')}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => profileQuery.refetch()} activeOpacity={0.8}>
          <Text style={s.retryText}>{t('common', 'retry') || 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const u = displayUser;
  const rank = (u.rank ?? 'Bronze') as UserRank;
  const rankColor = RANK_COLORS[rank] ?? colors.textMuted;
  const [rankMin, rankMax] = RANK_THRESHOLDS[rank] ?? [0, 1];
  const totalPts = u.totalPoints ?? 0;
  const rankProgress = rankMax > rankMin
    ? Math.min(((totalPts - rankMin) / (rankMax - rankMin)) * 100, 100)
    : 0;
  const rankIdx = RANK_ORDER.indexOf(rank);
  const nextRank = rankIdx < RANK_ORDER.length - 1 ? RANK_ORDER[rankIdx + 1] : null;

  return (
    <>
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Gradient Header ─────────────────────────── */}
        <LinearGradient
          colors={[rankColor + '25', colors.bgBase]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[s.headerGradient, { paddingTop: insets.top + spacing.md }]}
        >
          {/* Top row */}
          <View style={s.topRow}>
            <Text style={s.title}>{t('profile', 'title')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={s.settingsBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <FadeInView delay={100} style={s.avatarSection}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.85}>
              <Animated.View style={[s.avatarRing, { borderColor: rankColor + '60', transform: [{ scale: avatarScale }] }]}>
                <Image
                  source={u.avatar ? { uri: u.avatar } : require('../../../assets/icon.png')}
                  style={s.avatar}
                  contentFit="cover"
                />
              </Animated.View>
              <View style={[s.avatarEditBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          </FadeInView>

          {/* Username + online */}
          <FadeInView delay={200} style={s.nameSection}>
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.8} style={s.usernameRow}>
              <Text style={s.username}>{u.username}</Text>
              <Ionicons name="create-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={s.onlineRow}>
              <PulsingDot active={u.isOnline === true} />
              <Text style={[s.onlineText, { color: u.isOnline === true ? colors.success : colors.textMuted }]}>
                {u.isOnline === true ? 'Online' : 'Offline'}
              </Text>
            </View>
          </FadeInView>

          {/* Rank badge */}
          <FadeInView delay={300} style={s.rankSection}>
            <View style={[s.rankChip, { backgroundColor: rankColor + '18', borderColor: rankColor + '35' }]}>
              <Ionicons name={RANK_IONICONS[rank]} size={16} color={rankColor} />
              <Text style={[s.rankName, { color: rankColor }]}>{rank}</Text>
              <View style={s.rankDivider} />
              <Text style={[s.rankPts, { color: rankColor }]}>{totalPts} {t('profile', 'points')}</Text>
            </View>
          </FadeInView>

          {u.bio ? (
            <FadeInView delay={350}>
              <Text style={s.bio}>{u.bio}</Text>
            </FadeInView>
          ) : null}

          {/* Rank progress */}
          <FadeInView delay={400} style={s.progressWrap}>
            <View style={s.progressLabelRow}>
              <Text style={s.progressLabel}>{totalPts}</Text>
              <Text style={s.progressLabel}>{rankMax}</Text>
            </View>
            <AnimatedProgressBar progress={rankProgress} color={rankColor} delay={500} />
            {nextRank ? (
              <Text style={s.progressSub}>{rank}  →  {nextRank}</Text>
            ) : (
              <Text style={[s.progressSub, { color: rankColor, fontWeight: '700' }]}>MAX RANK</Text>
            )}
          </FadeInView>
        </LinearGradient>

        {/* ── Stats ──────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('profile', 'stats')}</Text>
          <View style={s.statsGrid}>
            <StatCard icon="film-outline" value={stats?.totalWatched ?? 0} label={t('profile', 'movies')} delay={200} iconColor={colors.primary} />
            <StatCard icon="time-outline" value={`${Math.round((stats?.totalMinutes ?? 0) / 60)}h`} label={t('profile', 'hours')} delay={300} iconColor={colors.secondary} />
            <StatCard icon="flash-outline" value={stats?.battlesWon ?? 0} label={t('profile', 'wins')} delay={400} iconColor={colors.error} />
            <StatCard icon="ribbon-outline" value={stats?.achievementsCount ?? 0} label={t('profile', 'badges')} delay={500} iconColor={colors.gold} />
          </View>
        </View>

        {/* ── Account info ───────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('profile', 'accountInfo')}</Text>
          <FadeInView delay={300} style={s.accountCard}>
            <InfoRow icon="mail-outline" label="Email" value={u.email ?? '—'} />
            <View style={s.infoDivider} />
            <InfoRow icon="shield-checkmark-outline" label={t('profile', 'role')} value={u.role ?? '—'} />
            <View style={s.infoDivider} />
            <InfoRow icon="calendar-outline" label={t('profile', 'joined')} value={formatDate(u.createdAt)} />
            <View style={s.infoDivider} />
            <InfoRow icon="time-outline" label={t('profile', 'lastLogin')} value={formatDate(u.lastLoginAt)} />
            {stats?.friendsCount !== undefined && (
              <>
                <View style={s.infoDivider} />
                <InfoRow icon="people-outline" label={t('profile', 'friends')} value={String(stats.friendsCount)} />
              </>
            )}
            {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
              <>
                <View style={s.infoDivider} />
                <InfoRow icon="flame-outline" label={t('profile', 'streak')} value={`${stats.currentStreak} ${t('stats', 'days')}`} />
              </>
            )}
          </FadeInView>
        </View>

        {/* ── Nav links ──────────────────────────────── */}
        <View style={s.section}>
          <NavItem
            icon="bar-chart-outline"
            label={t('profile', 'stats')}
            onPress={() => navigation.navigate('Stats')}
            delay={400}
          />
          <View style={{ height: spacing.sm }} />
          <NavItem
            icon="ribbon-outline"
            label={t('profile', 'achievements')}
            onPress={() => navigation.navigate('Achievements')}
            delay={500}
          />
        </View>

        {/* ── Logout ─────────────────────────────────── */}
        <FadeInView delay={600} style={s.section}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={s.logoutText}>{t('profile', 'logoutBtn')}</Text>
          </TouchableOpacity>
        </FadeInView>

        {profileQuery.isFetching && (
          <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary} size="small" />
        )}
        <View style={{ height: 60 + insets.bottom + spacing.xl }} />
      </ScrollView>

      {/* ── Edit Modal ───────────────────────────────── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setEditVisible(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{t('profile', 'editProfile')}</Text>

            <Text style={s.inputLabel}>{t('profile', 'username')}</Text>
            <TextInput
              style={s.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={s.inputLabel}>{t('profile', 'bio')}</Text>
            <TextInput
              style={[s.modalInput, s.modalInputMulti]}
              value={editBio}
              onChangeText={(txt) => setEditBio(txt.slice(0, 200))}
              placeholderTextColor={colors.textMuted}
              placeholder="Write something about yourself..."
              multiline
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{editBio.length}/200</Text>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditVisible(false)} activeOpacity={0.8}>
                <Text style={s.cancelText}>{t('common', 'cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, updateProfileMutation.isPending && s.btnDisabled]}
                onPress={handleSaveEdit}
                disabled={updateProfileMutation.isPending}
                activeOpacity={0.8}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.saveText}>{t('common', 'save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },

  // Header gradient
  headerGradient: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: spacing.md },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgBase,
  },

  // Name
  nameSection: { alignItems: 'center', gap: spacing.xs },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  username: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  onlineDotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  onlinePulse: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { ...typography.caption, fontWeight: '600' },

  // Rank
  rankSection: { marginTop: spacing.sm },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },

  rankName: { fontSize: 14, fontWeight: '700' },
  rankDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  rankPts: { fontSize: 12, fontWeight: '600' },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
    lineHeight: 20,
  },

  // Progress
  progressWrap: { width: SCREEN_W - spacing.xxl * 2, marginTop: spacing.md },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressLabel: { ...typography.caption, color: colors.textMuted },
  progressTrack: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  progressSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },

  // Section
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  // Stats
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },

  // Account info
  accountCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { ...typography.caption, color: colors.textMuted, flex: 1 },
  infoValue: { ...typography.body, color: colors.textPrimary, maxWidth: SCREEN_W * 0.45, textAlign: 'right' },
  infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 44 },

  // Nav links
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLinkText: { ...typography.body, color: colors.textPrimary, flex: 1, fontWeight: '500' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '25',
  },
  logoutText: { ...typography.body, color: colors.error, fontWeight: '600' },

  // Empty
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  inputLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
  modalInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalInputMulti: { height: 90, textAlignVertical: 'top' },
  charCount: { ...typography.caption, color: colors.textDim, textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
