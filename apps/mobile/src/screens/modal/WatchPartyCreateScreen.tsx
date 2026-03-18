// CineSync Mobile — WatchPartyCreateScreen
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { watchPartyApi } from '@api/watchParty.api';
import { contentApi } from '@api/content.api';
import { userApi } from '@api/user.api';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { IMovie, IUserPublic, ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;

const MAX_MEMBERS_OPTIONS = [2, 4, 6, 8, 10];

export function WatchPartyCreateScreen() {
  const navigation = useNavigation<Nav>();

  // Form
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(4);
  const [loading, setLoading] = useState(false);

  // Film selection
  const [filmMode, setFilmMode] = useState<'catalog' | 'url'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Friends
  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    userApi.getFriends().then(setFriends).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const result = await contentApi.search(searchQuery.trim());
        setSearchResults(result.movies.slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  const toggleFriend = useCallback((id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id],
    );
  }, []);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      Alert.alert('Xato', 'Xona nomi kiriting');
      return;
    }

    // Video majburiy — URL yoki katalogdan film tanlash kerak
    if (filmMode === 'catalog' && !selectedMovie) {
      Alert.alert('Xato', 'Katalogdan film tanlang yoki URL rejimiga o\'ting');
      return;
    }
    if (filmMode === 'url' && !videoUrl.trim()) {
      Alert.alert('Xato', 'Video URL kiriting');
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof watchPartyApi.createRoom>[0] = {
        name: roomName.trim(),
        isPrivate,
        maxMembers,
      };
      if (filmMode === 'catalog' && selectedMovie) {
        payload.movieId = selectedMovie._id;
        if (!selectedMovie.videoUrl) {
          Alert.alert(
            'Video mavjud emas',
            'Bu filmda video fayl hali yuklanmagan. URL orqali kiriting yoki boshqa film tanlang.',
          );
          setLoading(false);
          return;
        }
        payload.videoUrl = selectedMovie.videoUrl;
      } else if (filmMode === 'url' && videoUrl.trim()) {
        payload.videoUrl = videoUrl.trim();
      }
      const room = await watchPartyApi.createRoom(payload);
      navigation.replace('WatchParty', { roomId: room._id });
    } catch {
      Alert.alert('Xato', 'Xona yaratib bo\'lmadi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const selectedFriends = friends.filter(f => selectedFriendIds.includes(f._id));

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Watch Party yaratish</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Film tanlash */}
        <View style={styles.section}>
          <Text style={styles.label}>VIDEO MANBASI</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, filmMode === 'catalog' && styles.modeBtnActive]}
              onPress={() => {
                setFilmMode('catalog');
                setVideoUrl('');
              }}
            >
              <Ionicons
                name="film-outline"
                size={14}
                color={filmMode === 'catalog' ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[styles.modeBtnText, filmMode === 'catalog' && styles.modeBtnTextActive]}>
                Katalogdan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, filmMode === 'url' && styles.modeBtnActive]}
              onPress={() => {
                setFilmMode('url');
                setSelectedMovie(null);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Ionicons
                name="link-outline"
                size={14}
                color={filmMode === 'url' ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[styles.modeBtnText, filmMode === 'url' && styles.modeBtnTextActive]}>
                URL orqali
              </Text>
            </TouchableOpacity>
          </View>

          {filmMode === 'catalog' ? (
            selectedMovie ? (
              <View style={styles.selectedMovie}>
                {selectedMovie.posterUrl ? (
                  <Image source={{ uri: selectedMovie.posterUrl }} style={styles.moviePoster} />
                ) : null}
                <View style={styles.selectedMovieInfo}>
                  <Text style={styles.selectedMovieTitle} numberOfLines={2}>
                    {selectedMovie.title}
                  </Text>
                  <Text style={styles.selectedMovieMeta}>
                    {selectedMovie.year} · {selectedMovie.genre[0]}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMovie(null);
                    setSearchQuery('');
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Film nomini qidiring..."
                    placeholderTextColor={colors.textMuted}
                  />
                  {searching && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
                {searchResults.map(movie => (
                  <TouchableOpacity
                    key={movie._id}
                    style={styles.searchResult}
                    onPress={() => {
                      setSelectedMovie(movie);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {movie.title}
                    </Text>
                    <Text style={styles.searchResultMeta}>
                      {movie.year} · {movie.genre[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )
          ) : (
            <TextInput
              style={styles.input}
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="YouTube, HLS yoki to'g'ri link..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
          )}
        </View>

        {/* Room name */}
        <View style={styles.section}>
          <Text style={styles.label}>XONA NOMI</Text>
          <TextInput
            style={styles.input}
            value={roomName}
            onChangeText={setRoomName}
            placeholder="Masalan: Kecha filmlar kechasi 🎬"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
          />
          <Text style={styles.charCount}>{roomName.length}/50</Text>
        </View>

        {/* Private + Max members */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={isPrivate ? 'lock-closed' : 'globe-outline'}
                size={20}
                color={colors.secondary}
              />
              <View>
                <Text style={styles.rowTitle}>{isPrivate ? 'Shaxsiy' : 'Ommaviy'}</Text>
                <Text style={styles.rowSub}>
                  {isPrivate ? 'Faqat invite kod orqali' : 'Barcha qo\'shila oladi'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.bgElevated, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <Text style={[styles.label, { marginTop: spacing.md }]}>MAKSIMAL A'ZOLAR</Text>
          <View style={styles.membersRow}>
            {MAX_MEMBERS_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.memberChip, maxMembers === n && styles.memberChipActive]}
                onPress={() => setMaxMembers(n)}
              >
                <Text
                  style={[styles.memberChipText, maxMembers === n && styles.memberChipTextActive]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Do'stlarni taklif */}
        {friends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>DO'STLARNI TAKLIF QILISH</Text>
            {selectedFriends.length > 0 && (
              <View style={styles.selectedFriendsRow}>
                {selectedFriends.map(f => (
                  <TouchableOpacity
                    key={f._id}
                    style={styles.friendChip}
                    onPress={() => toggleFriend(f._id)}
                  >
                    <Text style={styles.friendChipText}>@{f.username}</Text>
                    <Ionicons name="close" size={12} color={colors.textPrimary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {friends.map(friend => {
              const selected = selectedFriendIds.includes(friend._id);
              return (
                <TouchableOpacity
                  key={friend._id}
                  style={styles.friendRow}
                  onPress={() => toggleFriend(friend._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {friend.username[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>
                    @{friend.username}
                  </Text>
                  <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                    {selected && (
                      <Ionicons name="checkmark" size={12} color={colors.textPrimary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.secondary} />
          <Text style={styles.infoText}>
            Xona yaratilgach invite kod hosil bo'ladi. Tanlangan do'stlaringizga yuboring!
          </Text>
        </View>
      </ScrollView>

      {/* Create button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color={colors.textPrimary} />
              <Text style={styles.createBtnText}>Xona yaratish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },

  // Mode toggle
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  modeBtnTextActive: { color: colors.textPrimary },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  searchResult: {
    padding: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  searchResultTitle: { ...typography.body, color: colors.textPrimary },
  searchResultMeta: { ...typography.caption, color: colors.textMuted },

  // Selected movie
  selectedMovie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  moviePoster: {
    width: 40,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
  },
  selectedMovieInfo: { flex: 1, gap: 2 },
  selectedMovieTitle: { ...typography.body, color: colors.textPrimary },
  selectedMovieMeta: { ...typography.caption, color: colors.textMuted },
  clearBtn: { padding: spacing.xs },

  // Input
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },

  // Row (private toggle)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rowSub: { ...typography.caption, color: colors.textMuted },

  // Max members
  membersRow: { flexDirection: 'row', gap: spacing.sm },
  memberChip: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberChipText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  memberChipTextActive: { color: colors.textPrimary },

  // Friends
  selectedFriendsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  friendChipText: { ...typography.caption, color: colors.textPrimary },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  friendName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  // Info card
  infoCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  infoText: { ...typography.caption, color: colors.textSecondary, flex: 1 },

  // Footer
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { ...typography.h3, color: colors.textPrimary },
});
