// WeWatch — Room list card component (extracted from RoomsScreen)
import React, { useRef, useEffect } from 'react';
import {
  View, Text, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { IWatchPartyRoom, WatchPartyStatus } from '@app-types/index';
import type { translations } from '@i18n/index';

type TFn = (section: keyof typeof translations, key: string) => string;

const STATUS_MAP: Record<WatchPartyStatus, { icon: keyof typeof Ionicons.glyphMap; labelKey: string; colorKey: 'success' | 'warning' | 'secondary' | 'textDim' }> = {
  waiting: { icon: 'hourglass-outline', labelKey: 'statusWaiting', colorKey: 'warning' },
  playing: { icon: 'play-circle', labelKey: 'statusPlaying', colorKey: 'success' },
  paused:  { icon: 'pause-circle', labelKey: 'statusPaused', colorKey: 'secondary' },
  ended:   { icon: 'checkmark-circle', labelKey: 'statusEnded', colorKey: 'textDim' },
};

export function RoomListCard({ room, index, onPress, onLongPress, t }: {
  room: IWatchPartyRoom;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
  t: TFn;
}) {
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
  const memberCount = room.memberCount ?? room.members?.length ?? 0;
  const isFull = memberCount >= room.maxMembers;
  const isEnded = room.status === 'ended';

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TrackedTouchable
        trackId="rooms:room_list_card"
        style={[s.card, isEnded && s.cardEnded]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={isEnded}
      >
        {/* Poster */}
        <View style={s.cardPoster}>
          {room.videoThumbnail ? (
            <Image source={{ uri: room.videoThumbnail }} style={s.posterImg} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[colors.primary + '30', colors.bgSurface]} style={s.posterPlaceholder}>
              <Ionicons name="film-outline" size={32} color={colors.textDim} />
            </LinearGradient>
          )}
          {room.status === 'playing' && (
            <View style={s.livePulseWrap}>
              <View style={[s.livePulseDot, { backgroundColor: colors.success }]} />
              <Text style={[s.livePulseText, { color: colors.success }]}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>{room.name || 'Watch Party'}</Text>
          {room.videoTitle && (
            <View style={s.movieRow}>
              <Ionicons name="film-outline" size={12} color={colors.textMuted} />
              <Text style={s.movieText} numberOfLines={1}>{room.videoTitle}</Text>
            </View>
          )}
          <View style={s.cardMeta}>
            <View style={[s.statusChip, { backgroundColor: statusColor + '15' }]}>
              <Ionicons name={statusCfg.icon} size={11} color={statusColor} />
              <Text style={[s.statusChipText, { color: statusColor }]}>{t('watchParty', statusCfg.labelKey)}</Text>
            </View>
            <View style={s.metaItem}>
              <Ionicons name="people" size={13} color={isFull ? colors.error : colors.textSecondary} />
              <Text style={[s.metaText, isFull && { color: colors.error }]}>{memberCount}/{room.maxMembers}</Text>
            </View>
            <View style={s.metaItem}>
              <Ionicons
                name={room.isPrivate ? 'lock-closed' : 'globe-outline'}
                size={12}
                color={room.isPrivate ? colors.warning : colors.success}
              />
            </View>
          </View>
        </View>
      </TrackedTouchable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createThemedStyles((colors) => ({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardEnded: { opacity: 0.5 },
  cardPoster: { width: 96, height: 96, position: 'relative' },
  posterImg: { width: '100%', height: '100%' },
  posterPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  livePulseWrap: {
    position: 'absolute', top: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  livePulseDot: { width: 6, height: 6, borderRadius: 3 },
  livePulseText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    gap: 4,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  movieRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  movieText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  cardMeta: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...typography.caption, color: colors.textSecondary },
}));
