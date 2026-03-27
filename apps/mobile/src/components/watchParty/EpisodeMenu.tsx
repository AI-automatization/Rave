// CineSync Mobile — EpisodeMenu (E68-2)
// Season/episode accordion modal
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  ListRenderItemInfo,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, typography } from '@theme/index';

export interface Episode {
  title: string;
  url: string;
  season?: number;
  episode?: number;
}

interface Props {
  visible: boolean;
  episodes: Episode[];
  currentUrl: string;
  onSelect: (episode: Episode) => void;
  onClose: () => void;
}

interface SeasonGroup {
  season: number | null;
  episodes: Episode[];
}

const SCREEN_H = Dimensions.get('window').height;
const NO_SEASON = -1;

function groupBySeason(episodes: Episode[]): SeasonGroup[] {
  const map = new Map<number, Episode[]>();
  for (const ep of episodes) {
    const key = ep.season ?? NO_SEASON;
    const arr = map.get(key) ?? [];
    arr.push(ep);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([season, eps]) => ({ season: season === NO_SEASON ? null : season, episodes: eps }));
}

function episodeLabel(ep: Episode): string {
  if (ep.season !== undefined && ep.episode !== undefined) {
    return `S${ep.season}E${ep.episode} — ${ep.title}`;
  }
  if (ep.episode !== undefined) return `E${ep.episode} — ${ep.title}`;
  return ep.title;
}

export function EpisodeMenu({ visible, episodes, currentUrl, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const groups = groupBySeason(episodes);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number | null>>(
    () => new Set([groups[0]?.season ?? null]),
  );

  const toggleSeason = (season: number | null) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(season)) next.delete(season);
      else next.add(season);
      return next;
    });
  };

  const renderEpisode = (ep: Episode) => {
    const isActive = ep.url === currentUrl;
    return (
      <TouchableOpacity
        key={ep.url}
        style={[styles.epItem, isActive && { backgroundColor: `${colors.primary}18` }]}
        onPress={() => { onSelect(ep); onClose(); }}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.epLabel, { color: isActive ? colors.primary : colors.textTertiary },
            isActive && styles.epLabelActive]}
          numberOfLines={2}
        >
          {episodeLabel(ep)}
        </Text>
        {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  const renderGroup = ({ item }: ListRenderItemInfo<SeasonGroup>) => {
    const isExpanded = expandedSeasons.has(item.season);
    const title = item.season !== null ? `Сезон ${item.season}` : 'Эпизоды';
    return (
      <View style={styles.seasonBlock}>
        <TouchableOpacity
          style={[styles.seasonHeader, { backgroundColor: colors.bgSurface }]}
          onPress={() => toggleSeason(item.season)}
          activeOpacity={0.7}
        >
          <Text style={[styles.seasonTitle, { color: colors.textSecondary }]}>{title}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
        {isExpanded && item.episodes.map(renderEpisode)}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <SafeAreaView style={[styles.sheet, { backgroundColor: colors.bgElevated }]} pointerEvents="box-none">
        <View style={[styles.handle, { backgroundColor: colors.bgMuted }]} />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Эпизодлар</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={groups}
          keyExtractor={(item) => String(item.season ?? 'no-season')}
          renderItem={renderGroup}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: SCREEN_H * 0.5,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
  },
  title: { ...typography.h3 },
  list: { marginTop: spacing.sm },
  seasonBlock: { marginBottom: spacing.sm },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  seasonTitle: { ...typography.h3 },
  epItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: 2,
  },
  epLabel: { ...typography.body, flex: 1, marginRight: spacing.sm },
  epLabelActive: { fontWeight: '600' },
});
