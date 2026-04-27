// CineSync Mobile — Home Screen (rooms-first + video search UX)
import React, { useState, useCallback, useEffect } from 'react';
import { captureError } from '@utils/errorLogger';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { HomeStackParamList, RootStackParamList } from '@app-types/index';
import { useDebounce } from '@hooks/useSearch';
import { useVideoSearch } from '@hooks/useVideoSearch';
import { usePublicRooms } from '@hooks/usePublicRooms';
import { watchPartyApi } from '@api/watchParty.api';
import type { VideoSearchItem } from '@api/content.api';
import { HomeActiveRooms } from '@components/home/HomeActiveRooms';
import { VideoSearchResults } from '@components/home/VideoSearchResults';
import { HomeCTA } from '@components/home/HomeCTA';
import { useNotificationStore } from '@store/notification.store';

type HomeNav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

const TAB_BAR_HEIGHT = 60;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const rootNav = useNavigation<RootNav>();
  const insets = useSafeAreaInsets();
  const { data: publicRooms, isLoading: roomsLoading, refetch: refetchRooms } = usePublicRooms();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { colors } = useTheme();
  const s = useStyles();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const debouncedQuery = useDebounce(query);
  const { data: videoResults = [], isLoading: searchLoading } = useVideoSearch(debouncedQuery);

  // TEST ERROR — удалить после теста
  useEffect(() => {
    try {
      const obj = undefined as unknown as { name: string };
      void obj.name;
    } catch (e) {
      captureError(e as Error, { screen: 'HomeScreen', trigger: 'mount' });
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refetchRooms(); } finally { setRefreshing(false); }
  };

  const handleSourcePicker = useCallback(() => {
    rootNav.navigate('Modal', { screen: 'SourcePicker', params: { mode: 'create' } });
  }, [rootNav]);

  const handleRoomPress = useCallback((roomId: string) => {
    rootNav.navigate('Modal', { screen: 'WatchParty', params: { roomId } });
  }, [rootNav]);

  const handleVideoSelect = useCallback(async (item: VideoSearchItem) => {
    if (creating) return;
    setCreating(true);
    try {
      const room = await watchPartyApi.createRoom({
        videoUrl: item.url,
        videoTitle: item.title,
        videoThumbnail: item.thumbnail || undefined,
        videoPlatform: item.platform,
      });
      setQuery('');
      rootNav.navigate('Modal', { screen: 'WatchParty', params: { roomId: room._id } });
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать комнату');
    } finally {
      setCreating(false);
    }
  }, [creating, rootNav]);

  const isSearchActive = debouncedQuery.trim().length >= 2;
  const rooms = publicRooms?.filter(r => r.status !== 'ended') ?? [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.logo}>
          CINE<Text style={s.logoAccent}>SYNC</Text>
        </Text>
        <TouchableOpacity
          style={s.notifBtn}
          onPress={() => rootNav.navigate('Modal', { screen: 'Notifications' })}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={[s.searchWrap, searchFocused && s.searchWrapFocused]}>
          <Ionicons name="search" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Поиск видео..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Creating room overlay */}
      {creating && (
        <View style={s.creatingBanner}>
          <Text style={s.creatingText}>Создаём комнату...</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          !isSearchActive
            ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            : undefined
        }
      >
        {isSearchActive ? (
          /* Video search results */
          <VideoSearchResults
            results={videoResults}
            isLoading={searchLoading}
            onSelect={handleVideoSelect}
          />
        ) : (
          /* Default: CTA + open rooms */
          <>
            <HomeCTA onPress={handleSourcePicker} />
            <HomeActiveRooms
              rooms={rooms}
              onRoomPress={handleRoomPress}
              isLoading={roomsLoading}
            />
          </>
        )}

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  logo: { ...typography.h2, color: colors.textPrimary, fontSize: 22, letterSpacing: 1 },
  logoAccent: { color: colors.primary },
  notifBtn: { padding: spacing.xs, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
  searchRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchWrapFocused: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.bgSurface,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 0 },
  creatingBanner: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  creatingText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
}));
