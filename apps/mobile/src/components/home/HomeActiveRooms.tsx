// CineSync Mobile — Live rooms card grid with thumbnails
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import type { IWatchPartyRoom } from '@app-types/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface HomeActiveRoomsProps {
  rooms: IWatchPartyRoom[];
  onRoomPress: (roomId: string) => void;
  isLoading?: boolean;
}

function RoomCard({ room, onPress }: { room: IWatchPartyRoom; onPress: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const memberCount = room.memberCount ?? room.members?.length ?? 0;
  const isPlaying = room.status === 'playing';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      {room.videoThumbnail ? (
        <Image source={{ uri: room.videoThumbnail }} style={s.thumb} resizeMode="cover" />
      ) : (
        <View style={[s.thumb, s.thumbPlaceholder]}>
          <Ionicons name="play-circle-outline" size={40} color={colors.primary + '90'} />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0.3, 0.65, 1]}
        style={s.gradient}
      >
        {isPlaying && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        )}

        <Text style={s.videoTitle} numberOfLines={2}>
          {room.videoTitle ?? room.name ?? 'Watch Party'}
        </Text>

        <View style={s.meta}>
          <Ionicons name="people" size={11} color="rgba(255,255,255,0.65)" />
          <Text style={s.metaText}>{memberCount}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  const s = useStyles();
  return <View style={[s.card, s.skeletonCard]} />;
}

export function HomeActiveRooms({ rooms, onRoomPress, isLoading }: HomeActiveRoomsProps) {
  const s = useStyles();

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>ОТКРЫТЫЕ КОМНАТЫ</Text>
        {isLoading && <ActivityIndicator size="small" color={s.activityColor.color} />}
      </View>

      {isLoading && rooms.length === 0 ? (
        <View style={s.skeletonGrid}>
          <View style={s.skeletonRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <View style={s.skeletonRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : rooms.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="tv-outline" size={32} color={s.emptyIcon.color} />
          <Text style={s.emptyText}>Нет активных комнат</Text>
          <Text style={s.emptyHint}>Создай комнату и позови друзей</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <RoomCard room={item} onPress={() => onRoomPress(item._id)} />
          )}
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  activityColor: { color: colors.primary },
  grid: {
    gap: CARD_GAP,
  },
  row: {
    gap: CARD_GAP,
  },
  skeletonGrid: {
    gap: CARD_GAP,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  thumbPlaceholder: {
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xl,
    gap: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.85)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  videoTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    lineHeight: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  skeletonCard: {
    backgroundColor: colors.bgSurface,
    opacity: 0.5,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyIcon: { color: colors.textDim },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
}));
