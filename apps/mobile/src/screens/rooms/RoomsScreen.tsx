// CineSync Mobile — Rooms Screen (all open watch party rooms)
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { RootStackParamList, IWatchPartyRoom, WatchPartyStatus } from '@app-types/index';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { useT } from '@i18n/index';
import type { translations } from '@i18n/index';

type TFn = (section: keyof typeof translations, key: string) => string;

const TAB_BAR_HEIGHT = 60;

const STATUS_MAP: Record<WatchPartyStatus, { icon: string; labelKey: string; colorKey: 'success' | 'warning' | 'secondary' | 'textDim' }> = {
  waiting: { icon: 'hourglass-outline', labelKey: 'statusWaiting', colorKey: 'warning' },
  playing: { icon: 'play-circle', labelKey: 'statusPlaying', colorKey: 'success' },
  paused: { icon: 'pause-circle', labelKey: 'statusPaused', colorKey: 'secondary' },
  ended: { icon: 'checkmark-circle', labelKey: 'statusEnded', colorKey: 'textDim' },
};

// ─── Animated card ──────────────────────────────────────────────
function RoomListCard({ room, index, onPress, t }: { room: IWatchPartyRoom; index: number; onPress: () => void; t: TFn }) {
  const { colors } = useTheme();
  const s = useStyles();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
      ]).start();
    }, index * 70);
    return () => clearTimeout(timer);
  }, [index, opacity, translateY]);

  const statusCfg = STATUS_MAP[room.status] ?? STATUS_MAP.waiting;
  const statusColor = colors[statusCfg.colorKey];
  const memberCount = room.memberCount ?? room.members.length;
  const isFull = memberCount >= room.maxMembers;
  const isEnded = room.status === 'ended';

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        style={[s.card, isEnded && s.cardEnded]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={isEnded}
      >
        {/* Poster / Thumbnail */}
        <View style={s.cardPoster}>
          {room.videoThumbnail ? (
            <Image source={{ uri: room.videoThumbnail }} style={s.posterImg} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[colors.primary + '30', colors.bgSurface]} style={s.posterPlaceholder}>
              <Ionicons name="film-outline" size={32} color={colors.textDim} />
            </LinearGradient>
          )}
          {/* Live pulse indicator */}
          {room.status === 'playing' && (
            <View style={s.livePulseWrap}>
              <View style={[s.livePulseDot, { backgroundColor: colors.success }]} />
              <Text style={[s.livePulseText, { color: colors.success }]}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Card body */}
        <View style={s.cardBody}>
          {/* Room name */}
          <Text style={s.cardTitle} numberOfLines={1}>
            {room.name || 'Watch Party'}
          </Text>

          {/* Movie title */}
          {room.videoTitle && (
            <View style={s.movieRow}>
              <Ionicons name="film-outline" size={12} color={colors.textMuted} />
              <Text style={s.movieText} numberOfLines={1}>{room.videoTitle}</Text>
            </View>
          )}

          {/* Bottom meta row */}
          <View style={s.cardMeta}>
            {/* Status chip */}
            <View style={[s.statusChip, { backgroundColor: statusColor + '15' }]}>
              <Ionicons name={statusCfg.icon as keyof typeof Ionicons.glyphMap} size={11} color={statusColor} />
              <Text style={[s.statusChipText, { color: statusColor }]}>{t('watchParty', statusCfg.labelKey)}</Text>
            </View>

            {/* Members */}
            <View style={s.metaItem}>
              <Ionicons name="people" size={13} color={isFull ? colors.error : colors.textSecondary} />
              <Text style={[s.metaText, isFull && { color: colors.error }]}>
                {memberCount}/{room.maxMembers}
              </Text>
            </View>

            {/* Privacy */}
            <View style={s.metaItem}>
              <Ionicons
                name={room.isPrivate ? 'lock-closed' : 'globe-outline'}
                size={12}
                color={room.isPrivate ? colors.warning : colors.success}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────
export function RoomsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const { t } = useT();
  const { data: rooms, isLoading, refetch, isRefetching } = useWatchPartyRooms();

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
          <TouchableOpacity style={s.joinCodeBtn} onPress={handleJoin} activeOpacity={0.7}>
            <Ionicons name="key-outline" size={16} color={colors.secondary} />
            <Text style={s.joinCodeText}>{t('watchParty', 'tabCode')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick action buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.createRoomBtn} onPress={handleCreate} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight ?? '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.createRoomGradient}
            >
              <Ionicons name="add-circle" size={18} color={colors.white} />
              <Text style={s.createRoomText}>{t('watchParty', 'createRoom')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats pills */}
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          contentContainerStyle={s.scrollContent}
        >
          {/* Empty state */}
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
              <TouchableOpacity style={s.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={s.emptyBtnText}>{t('watchParty', 'createRoom')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active rooms */}
          {activeRooms.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('watchParty', 'activeRooms')}</Text>
              {activeRooms.map((room, i) => (
                <RoomListCard
                  key={room._id}
                  room={room}
                  index={i}
                  onPress={() => handleRoomPress(room._id)}
                  t={t}
                />
              ))}
            </View>
          )}

          {/* Ended rooms */}
          {endedRooms.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.textDim }]}>{t('watchParty', 'endedRooms')}</Text>
              {endedRooms.map((room, i) => (
                <RoomListCard
                  key={room._id}
                  room={room}
                  index={activeRooms.length + i}
                  onPress={() => handleRoomPress(room._id)}
                  t={t}
                />
              ))}
            </View>
          )}

          <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  joinCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  joinCodeText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createRoomBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  createRoomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  createRoomText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Content
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },

  // Room card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardEnded: {
    opacity: 0.5,
  },
  cardPoster: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseWrap: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  livePulseText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    gap: 4,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  movieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  movieText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    marginBottom: spacing.sm,
  },
  emptyIconGradient: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  emptyBtnText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
}));
