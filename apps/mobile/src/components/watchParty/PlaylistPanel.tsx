// CineSync Mobile — WatchParty Playlist Panel (T-E107)
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const s = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(17,17,24,0.97)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  addBtn: {
    marginTop: 4, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#7B72F8', borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  playNextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginVertical: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#7B72F8', borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playNextText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { maxHeight: 180 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemIcon: { marginRight: 10 },
  itemTitle: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});
