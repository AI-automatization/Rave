// WeWatch Mobile — compact horizontal row of the user's own rooms.
// Smaller than the main RoomGrid — a quick "jump back into your room" strip.
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius } from '@theme/index';
import type { IWatchPartyRoom } from '@app-types/index';

const CARD_W = 156;
const THUMB_H = 88;

function MyRoomCard({ room, onPress }: { room: IWatchPartyRoom; onPress: () => void }) {
  const { colors } = useTheme();
  const isPlaying = room.status === 'playing';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      <View style={s.thumbWrap}>
        {room.videoThumbnail ? (
          <Image source={{ uri: room.videoThumbnail }} style={s.thumb} contentFit="cover" />
        ) : (
          <View style={[s.thumb, s.thumbPlaceholder]}>
            <Ionicons name="film-outline" size={26} color={colors.textDim} />
          </View>
        )}
        {isPlaying && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {room.videoTitle ?? room.name ?? 'Watch Party'}
      </Text>

      <View style={s.meta}>
        <Ionicons name="people" size={11} color={colors.textDim} />
        <Text style={[s.metaText, { color: colors.textDim }]}>{room.memberCount ?? room.members?.length ?? 0}/{room.maxMembers}</Text>
        <View style={{ flex: 1 }} />
        <Ionicons
          name={room.isPrivate ? 'lock-closed' : 'globe-outline'}
          size={11}
          color={room.isPrivate ? colors.warning + 'BB' : colors.success + 'BB'}
        />
      </View>
    </TouchableOpacity>
  );
}

export function MyRoomsRow({
  rooms,
  onPress,
}: {
  rooms: IWatchPartyRoom[];
  onPress: (roomId: string) => void;
}) {
  if (rooms.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {rooms.map(r => (
        <MyRoomCard key={r._id} room={r} onPress={() => onPress(r._id)} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingRight: spacing.md, paddingBottom: 2 },
  card: {
    width: CARD_W,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  thumbWrap: { width: '100%', height: THUMB_H, position: 'relative' },
  thumb: { width: '100%', height: THUMB_H },
  thumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 6, left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F87171' },
  liveText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  title: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    paddingHorizontal: 8,
    paddingTop: 7,
    minHeight: 30,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 5,
  },
  metaText: { fontSize: 10.5 },
});
