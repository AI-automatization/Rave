// WeWatch — Room Grid Card components (extracted from HomeScreen)
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius } from '@theme/index';
import type { IWatchPartyRoom } from '@app-types/index';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = spacing.sm;
const CARD_W   = (SCREEN_W - spacing.xl * 2 - CARD_GAP) / 2;
const CARD_H   = CARD_W * 1.48;

export { CARD_GAP };

// ─── Skeleton grid card ───────────────────────────────────────────────────────

export function SkeletonGridCard() {
  const s = useStyles();
  const anim = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.65, duration: 720, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.28, duration: 720, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return <Animated.View style={[s.skeletonCard, { opacity: anim }]} />;
}

// ─── Room grid card ───────────────────────────────────────────────────────────

export function RoomGridCard({ room, index, onPress, onLongPress }: {
  room: IWatchPartyRoom;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();

  const opacity    = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0.86)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.85)).current;

  const memberCount = room.memberCount ?? room.members?.length ?? 0;
  const isPlaying   = room.status === 'playing';
  const isPaused    = room.status === 'paused';
  const isWaiting   = room.status === 'waiting';
  const isEnded     = room.status === 'ended';

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,   { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 95, friction: 11 }),
      ]).start();
    }, index * 55);
    return () => clearTimeout(timer);
  }, [index, opacity, cardScale]);

  useEffect(() => {
    if (!isPlaying) return;
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 2.6,  duration: 850, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 850, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1,    duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.85, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(350),
      ])
    ).start();
  }, [isPlaying, pulseScale, pulseOpacity]);

  const onPressIn  = () =>
    Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: true, tension: 300, friction: 15 }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, tension: 180, friction: 10 }).start();

  const combinedScale = Animated.multiply(cardScale, pressScale);

  const borderColor = isPlaying
    ? colors.success + '45'
    : isPaused
      ? colors.secondary + '35'
      : colors.border;

  return (
    <Animated.View style={{ opacity, transform: [{ scale: combinedScale }], width: CARD_W }}>
      <TrackedTouchable
        trackId="home:room_card"
        style={[s.card, { borderColor, opacity: isEnded ? 0.42 : 1 }]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        disabled={isEnded}
      >
        {/* Thumbnail */}
        {room.videoThumbnail ? (
          <Image source={{ uri: room.videoThumbnail }} style={s.thumbnail} resizeMode="cover" />
        ) : (
          <View style={s.thumbnailPlaceholder}>
            <Ionicons
              name={isPlaying ? 'play-circle' : isEnded ? 'checkmark-circle-outline' : 'film-outline'}
              size={44}
              color={isPlaying ? colors.primary + '88' : colors.textDim}
            />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.94)']}
          locations={[0.22, 0.58, 1]}
          style={s.cardGradient}
        >
          {/* Status badges */}
          {isPlaying && (
            <View style={s.liveBadge}>
              <View style={s.liveDotWrap}>
                <Animated.View style={[s.liveDotPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
                <View style={s.liveDotCore} />
              </View>
              <Text style={s.liveBadgeText}>LIVE</Text>
            </View>
          )}

          {isWaiting && (
            <View style={[s.statusBadge, { backgroundColor: colors.warning + '22', borderColor: colors.warning + '40' }]}>
              <Text style={[s.statusBadgeText, { color: colors.warning }]}>KUTMOQDA</Text>
            </View>
          )}

          {isPaused && (
            <View style={[s.statusBadge, { backgroundColor: colors.secondary + '22', borderColor: colors.secondary + '40' }]}>
              <Text style={[s.statusBadgeText, { color: colors.secondary }]}>TO'XTATILGAN</Text>
            </View>
          )}

          {isEnded && (
            <View style={s.endedBadge}>
              <Text style={s.endedBadgeText}>TUGAGAN</Text>
            </View>
          )}

          {/* Title */}
          <Text style={s.cardTitle} numberOfLines={2}>
            {room.videoTitle ?? room.name ?? 'Watch Party'}
          </Text>

          {/* Meta row */}
          <View style={s.metaRow}>
            <Ionicons name="people" size={11} color={colors.textDim} />
            <Text style={s.metaText}>{memberCount}/{room.maxMembers}</Text>
            <View style={s.metaSpacer} />
            <Ionicons
              name={room.isPrivate ? 'lock-closed' : 'globe-outline'}
              size={11}
              color={room.isPrivate ? colors.warning + 'BB' : colors.success + 'BB'}
            />
          </View>
        </LinearGradient>
      </TrackedTouchable>
    </Animated.View>
  );
}

// ─── Room grid (2 cols) ──────────────────────────────────────────────────────

export function RoomGrid({ rooms, onPress, onLongPress }: {
  rooms: IWatchPartyRoom[];
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const rows: IWatchPartyRoom[][] = [];
  for (let i = 0; i < rooms.length; i += 2) {
    rows.push(rooms.slice(i, i + 2));
  }
  return (
    <View style={{ gap: CARD_GAP }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: CARD_GAP }}>
          {row.map((rm, ci) => (
            <RoomGridCard
              key={rm._id}
              room={rm}
              index={ri * 2 + ci}
              onPress={() => onPress(rm._id)}
              onLongPress={() => onLongPress(rm._id)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createThemedStyles((colors) => ({
  skeletonCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
  },
  thumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xl * 1.6,
    gap: 4,
  },
  // Live badge
  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.88)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  liveDotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotPulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  liveDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  liveBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  // Status badges
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  endedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  endedBadgeText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Card content
  cardTitle: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '500',
  },
  metaSpacer: { flex: 1 },
}));
