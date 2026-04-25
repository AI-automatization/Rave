// CineSync Mobile — WatchParty Playlist Panel (T-E107)
import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { VideoItem } from '@app-types/index';

interface PlaylistPanelProps {
  playlist: VideoItem[];
  isOwner: boolean;
  onAddToQueue: () => void;
  onRemove: (index: number) => void;
  onPlayNext: () => void;
  onClose: () => void;
}

export function PlaylistPanel({ playlist, isOwner, onAddToQueue, onRemove, onPlayNext, onClose }: PlaylistPanelProps) {
  const s = useStyles();
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Playlist ({playlist.length})</Text>
        <View style={s.headerActions}>
          {isOwner && (
            <TouchableOpacity style={s.iconBtn} onPress={onAddToQueue} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.iconBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      {playlist.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="list-outline" size={28} color="rgba(255,255,255,0.2)" />
          <Text style={s.emptyText}>Queue bo'sh</Text>
          {isOwner && (
            <TouchableOpacity style={s.addBtn} onPress={onAddToQueue}>
              <Text style={s.addBtnText}>+ Video qo'shish</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {isOwner && (
            <TouchableOpacity style={s.playNextBtn} onPress={onPlayNext}>
              <Ionicons name="play-skip-forward" size={16} color="#fff" />
              <Text style={s.playNextText}>Keyingisini ijro et</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={playlist}
            keyExtractor={(_, i) => String(i)}
            style={s.list}
            renderItem={({ item, index }) => (
              <View style={s.item}>
                <Ionicons name="film-outline" size={16} color="rgba(255,255,255,0.4)" style={s.itemIcon} />
                <Text style={s.itemTitle} numberOfLines={1}>
                  {item.videoTitle ?? item.videoUrl}
                </Text>
                {isOwner && (
                  <TouchableOpacity onPress={() => onRemove(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.caption, color: colors.textMuted },
  addBtn: {
    marginTop: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
  },
  addBtnText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  playNextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.lg, marginVertical: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  playNextText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  list: { maxHeight: 180 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  itemIcon: { marginRight: spacing.sm },
  itemTitle: { flex: 1, ...typography.caption, color: colors.textSecondary },
}));
