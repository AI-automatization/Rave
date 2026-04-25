// CineSync Mobile — WatchParty Room Card
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { IWatchPartyRoom, WatchPartyStatus } from '@app-types/index';
import type { translations } from '@i18n/index';

type TFn = (section: keyof typeof translations, key: string) => string;

interface RoomCardProps {
  room: IWatchPartyRoom;
  index: number;
  onPress: (roomId: string) => void;
  t: TFn;
}

const STATUS_CONFIG: Record<WatchPartyStatus, { icon: string; labelKey: string; color: string }> = {
  waiting: { icon: 'hourglass-outline', labelKey: 'statusWaiting', color: '#FBBF24' },
  playing: { icon: 'play-circle', labelKey: 'statusPlaying', color: '#34D399' },
  paused: { icon: 'pause-circle', labelKey: 'statusPaused', color: '#60A5FA' },
  ended: { icon: 'checkmark-circle', labelKey: 'statusEnded', color: '#71717A' },
};

export function RoomCard({ room, index, onPress, t }: RoomCardProps) {
  const s = useStyles();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const delay = index * 80;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [index, opacity, translateY]);

  const statusCfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.waiting;
  const memberCount = room.memberCount ?? room.members.length;
  const isFull = memberCount >= room.maxMembers;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={s.card}
        onPress={() => onPress(room._id)}
        activeOpacity={0.8}
        disabled={room.status === 'ended'}
      >
        {/* Thumbnail */}
        <View style={s.thumbWrap}>
          {room.videoThumbnail ? (
            <Image source={{ uri: room.videoThumbnail }} style={s.thumb} resizeMode="cover" />
          ) : (
            <View style={s.thumbPlaceholder}>
              <Ionicons name="tv-outline" size={28} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
            <Ionicons name={statusCfg.icon as keyof typeof Ionicons.glyphMap} size={12} color={statusCfg.color} />
            <Text style={[s.statusText, { color: statusCfg.color }]}>{t('watchParty', statusCfg.labelKey)}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.roomName} numberOfLines={1}>
            {room.name || room.videoTitle || 'Watch Party'}
          </Text>

          {room.videoTitle && room.name ? (
            <Text style={s.movieTitle} numberOfLines={1}>
              {room.videoTitle}
            </Text>
          ) : null}

          <View style={s.metaRow}>
            {/* Members */}
            <View style={s.metaItem}>
              <Ionicons name="people" size={14} color={isFull ? '#F87171' : '#60A5FA'} />
              <Text style={[s.metaText, isFull && s.metaTextFull]}>
                {memberCount}/{room.maxMembers}
              </Text>
            </View>

            {/* Privacy */}
            <View style={s.metaItem}>
              <Ionicons
                name={room.isPrivate ? 'lock-closed' : 'globe-outline'}
                size={13}
                color={room.isPrivate ? '#FBBF24' : '#34D399'}
              />
              <Text style={s.metaText}>
                {room.isPrivate ? t('watchParty', 'private') : t('watchParty', 'open')}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View style={s.arrowWrap}>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  thumbWrap: {
    width: 88,
    height: 88,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 3,
  },
  roomName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  movieTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaTextFull: {
    color: '#F87171',
  },
  arrowWrap: {
    paddingRight: spacing.md,
  },
}));
