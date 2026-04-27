// CineSync Mobile — Video search results list
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import type { VideoSearchItem } from '@api/content.api';

const PLATFORM_ICON: Record<VideoSearchItem['platform'], string> = {
  youtube: 'logo-youtube',
  rutube:  'play-circle',
  vk:      'people-circle',
};

const PLATFORM_COLOR: Record<VideoSearchItem['platform'], string> = {
  youtube: '#FF0000',
  rutube:  '#00B4FF',
  vk:      '#4C75A3',
};

function formatDuration(sec?: number): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  results: VideoSearchItem[];
  isLoading: boolean;
  onSelect: (item: VideoSearchItem) => void;
}

function ResultCard({ item, onPress }: { item: VideoSearchItem; onPress: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const dur = formatDuration(item.duration);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.thumbWrap}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={s.thumb} resizeMode="cover" />
        ) : (
          <View style={[s.thumb, s.thumbPlaceholder]}>
            <Ionicons name="play-circle-outline" size={28} color={colors.textDim} />
          </View>
        )}
        {dur ? (
          <View style={s.durBadge}>
            <Text style={s.durText}>{dur}</Text>
          </View>
        ) : null}
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <View style={s.meta}>
          <Ionicons
            name={PLATFORM_ICON[item.platform] as keyof typeof Ionicons.glyphMap}
            size={12}
            color={PLATFORM_COLOR[item.platform]}
          />
          <Text style={[s.platform, { color: PLATFORM_COLOR[item.platform] }]}>
            {item.platform.toUpperCase()}
          </Text>
        </View>
      </View>

      <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
    </TouchableOpacity>
  );
}

export function VideoSearchResults({ results, isLoading, onSelect }: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Ищем по YouTube, Rutube, VK...</Text>
      </View>
    );
  }

  if (results.length === 0) return null;

  return (
    <FlatList
      data={results}
      keyExtractor={(item, i) => `${item.url}-${i}`}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ResultCard item={item} onPress={() => onSelect(item)} />
      )}
    />
  );
}

const THUMB_W = 120;
const THUMB_H = 68;

const useStyles = createThemedStyles((colors) => ({
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  thumbWrap: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: colors.bgSurface,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platform: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
}));
