// WeWatch Mobile — Rooms Screen (all open watch party rooms)
import React, { useState } from 'react';
import {
  View, Text, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { ReportRoomModal } from '@components/common/ReportRoomModal';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { RootStackParamList } from '@app-types/index';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { useT } from '@i18n/index';
import { RoomListCard } from '@components/rooms/RoomListCard';

const TAB_BAR_HEIGHT = 60;

// ─── Main Screen ────────────────────────────────────────────────
export function RoomsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const { t } = useT();
  const { data: rooms, isLoading, refetch, isRefetching } = useWatchPartyRooms();
  const [reportRoomId, setReportRoomId] = useState<string | null>(null);

  const liveRooms = (rooms ?? []).filter(r => r.status === 'playing');
  const waitingRooms = (rooms ?? []).filter(r => r.status === 'waiting');
  const pausedRooms = (rooms ?? []).filter(r => r.status === 'paused');
  const endedRooms = (rooms ?? []).filter(r => r.status === 'ended');
  const activeRooms = [...liveRooms, ...waitingRooms, ...pausedRooms];

  const handleRoomPress = (roomId: string) => {
    navigation.navigate('Modal', { screen: 'WatchParty', params: { roomId } });
  };

  const handleCreate = () => {
    navigation.navigate('Modal', { screen: 'WatchPartyCreate' });
  };

  const handleJoin = () => {
    navigation.navigate('Modal', { screen: 'WatchPartyJoin' });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary + '10', colors.bgBase]}
        style={[s.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={s.headerTop}>
          <View style={s.headerTitleRow}>
            <Ionicons name="tv" size={22} color={colors.primary} />
            <Text style={s.headerTitle}>Watch Party</Text>
          </View>
          <TrackedTouchable trackId="rooms:join_by_code" style={s.joinCodeBtn} onPress={handleJoin} activeOpacity={0.7}>
            <Ionicons name="key-outline" size={16} color={colors.secondary} />
            <Text style={s.joinCodeText}>{t('watchParty', 'tabCode')}</Text>
          </TrackedTouchable>
        </View>

        {/* Quick action buttons */}
        <View style={s.actionsRow}>
          <TrackedTouchable trackId="rooms:create_room" style={s.createRoomBtn} onPress={handleCreate} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight ?? '#9333EA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.createRoomGradient}
            >
              <Ionicons name="add-circle" size={18} color={colors.white} />
              <Text style={s.createRoomText}>{t('watchParty', 'createRoom')}</Text>
            </LinearGradient>
          </TrackedTouchable>

          {activeRooms.length > 0 && (
            <View style={s.statsPill}>
              <View style={[s.statDot, { backgroundColor: colors.success }]} />
              <Text style={s.statsText}>{activeRooms.length} {t('watchParty', 'activeCount')}</Text>
            </View>
          )}
          {liveRooms.length > 0 && (
            <View style={[s.statsPill, { backgroundColor: colors.success + '12' }]}>
              <Ionicons name="play" size={12} color={colors.success} />
              <Text style={[s.statsText, { color: colors.success }]}>{liveRooms.length} {t('watchParty', 'live')}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={s.scrollContent}
        >
          {(!rooms || rooms.length === 0) && (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconWrap}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.secondary + '15']}
                  style={s.emptyIconGradient}
                >
                  <Ionicons name="tv-outline" size={56} color={colors.textDim} />
                </LinearGradient>
              </View>
              <Text style={s.emptyTitle}>{t('watchParty', 'noRoomsTitle')}</Text>
              <Text style={s.emptySub}>{t('watchParty', 'noRoomsSub')}</Text>
              <TrackedTouchable trackId="rooms:empty_state_create" style={s.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={s.emptyBtnText}>{t('watchParty', 'createRoom')}</Text>
              </TrackedTouchable>
            </View>
          )}

          {activeRooms.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('watchParty', 'activeRooms')}</Text>
              {activeRooms.map((room, i) => (
                <RoomListCard key={room._id} room={room} index={i}
                  onPress={() => handleRoomPress(room._id)}
                  onLongPress={() => setReportRoomId(room._id)} t={t} />
              ))}
            </View>
          )}

          {endedRooms.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.textDim }]}>{t('watchParty', 'endedRooms')}</Text>
              {endedRooms.map((room, i) => (
                <RoomListCard key={room._id} room={room} index={activeRooms.length + i}
                  onPress={() => handleRoomPress(room._id)} t={t} />
              ))}
            </View>
          )}

          <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
        </ScrollView>
      )}

      <ReportRoomModal visible={!!reportRoomId} roomId={reportRoomId ?? ''} onClose={() => setReportRoomId(null)} />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h1, color: colors.textPrimary },
  joinCodeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  joinCodeText: { ...typography.caption, color: colors.secondary, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  createRoomBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  createRoomGradient: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  createRoomText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  statsPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
  },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statsText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.label, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.sm,
  },

  emptyWrap: {
    alignItems: 'center', paddingTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  emptyIconWrap: { marginBottom: spacing.sm },
  emptyIconGradient: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.xl, marginTop: spacing.sm,
  },
  emptyBtnText: { ...typography.body, color: colors.primary, fontWeight: '700' },
}));
