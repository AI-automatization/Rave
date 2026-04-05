// CineSync Mobile — Home active Watch Party rooms section
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import type { IWatchPartyRoom } from '@app-types/index';

interface HomeActiveRoomsProps {
  rooms: IWatchPartyRoom[];
  onRoomPress: (roomId: string) => void;
}

function ActiveRoomRow({
  room,
  onPress,
}: {
  room: IWatchPartyRoom;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const memberCount = room.memberCount ?? room.members?.length ?? 0;
  const isPlaying = room.status === 'playing';

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.statusDot, isPlaying && s.statusDotLive]} />
      <View style={s.rowInfo}>
        <Text style={s.rowName} numberOfLines={1}>
          {room.name || room.videoTitle || 'Watch Party'}
        </Text>
        {room.videoTitle && room.name ? (
          <Text style={s.rowSub} numberOfLines={1}>{room.videoTitle}</Text>
        ) : null}
      </View>
      <View style={s.rowMeta}>
        <Ionicons name="people" size={13} color={colors.secondary} />
        <Text style={s.rowMetaText}>{memberCount}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
    </TouchableOpacity>
  );
}

export function HomeActiveRooms({ rooms, onRoomPress }: HomeActiveRoomsProps) {
  const s = useStyles();

  if (rooms.length === 0) return null;

  return (
    <View style={s.section}>
      <Text style={s.label}>FAOL XONALAR</Text>
      {rooms.slice(0, 3).map((room) => (
        <ActiveRoomRow
          key={room._id}
          room={room}
          onPress={() => onRoomPress(room._id)}
        />
      ))}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textDim,
    flexShrink: 0,
  },
  statusDotLive: {
    backgroundColor: colors.success,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rowMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
}));
