// WeWatch Mobile — Home Screen
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { captureError } from '@utils/errorLogger';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportRoomModal } from '@components/common/ReportRoomModal';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { HomeStackParamList, RootStackParamList } from '@app-types/index';
import { useDebounce } from '@hooks/useSearch';
import { useVideoSearch } from '@hooks/useVideoSearch';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { useCreateWatchParty } from '@hooks/useCreateWatchParty';
import { VideoSearchResults } from '@components/home/VideoSearchResults';
import { HomeCTA } from '@components/home/HomeCTA';
import { WeWatchLogo } from '@components/common/WeWatchLogo';
import { SkeletonGridCard, RoomGrid, CARD_GAP } from '@components/home/RoomGridCard';
import { useNotificationStore } from '@store/notification.store';
import { useT } from '@i18n/index';

const TAB_BAR_HEIGHT = 60;

type HomeNav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

// ─── Home Screen ──────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const rootNav    = useNavigation<RootNav>();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const s          = useStyles();
  const { t }      = useT();

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms, isRefetching } = useWatchPartyRooms();
  const unreadCount = useNotificationStore((st) => st.unreadCount);

  const [refreshing,    setRefreshing]    = useState(false);
  const [query,         setQuery]         = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [reportRoomId,  setReportRoomId]  = useState<string | null>(null);

  const bellAnim   = useRef(new Animated.Value(0)).current;
  const prevUnread = useRef(0);

  const debouncedQuery = useDebounce(query);
  const { data: videoResults = [], isLoading: searchLoading } = useVideoSearch(debouncedQuery);
  const { creating, createFromVideo } = useCreateWatchParty(() => setQuery(''));

  // TEST ERROR — удалить после теста
  useEffect(() => {
    try {
      const obj = undefined as unknown as { name: string };
      void obj.name;
    } catch (e) {
      captureError(e as Error, { screen: 'HomeScreen', trigger: 'mount' });
    }
  }, []);

  useEffect(() => {
    if (unreadCount > 0 && unreadCount !== prevUnread.current) {
      prevUnread.current = unreadCount;
      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 1,     duration: 70, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -1,    duration: 70, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0.75,  duration: 70, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -0.75, duration: 70, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0,     duration: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [unreadCount, bellAnim]);

  const bellRotate = bellAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });

  const allRooms    = rooms ?? [];
  const activeRooms = useMemo(() => allRooms.filter(r => r.status !== 'ended'), [allRooms]);
  const endedRooms  = useMemo(() => allRooms.filter(r => r.status === 'ended'),  [allRooms]);

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

  const isSearchActive = debouncedQuery.trim().length >= 2;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['rgba(124,58,237,0.22)', 'rgba(124,58,237,0.04)', 'transparent']}
        style={[s.topGlow, { height: insets.top + 100 }]}
        pointerEvents="none"
      />

      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <WeWatchLogo variant="horizontal" size={40} theme="dark" />

        <TouchableOpacity
          style={s.notifBtn}
          onPress={() => rootNav.navigate('Modal', { screen: 'Notifications' })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={s.notifBox}>
            <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Search ────────────────────────────────────────────── */}
      <View style={s.searchRow}>
        <View style={[s.searchBox, searchFocused && s.searchBoxFocused]}>
          <Ionicons name="search-outline" size={17} color={searchFocused ? colors.primary : colors.textDim} />
          <TextInput
            style={s.searchInput}
            placeholder="Video qidirish..."
            placeholderTextColor={colors.textDim}
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
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {creating && (
        <View style={s.creatingBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.creatingText}>Xona yaratilmoqda...</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scrollContent}
        refreshControl={
          !isSearchActive
            ? <RefreshControl refreshing={refreshing || isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
            : undefined
        }
      >
        {isSearchActive ? (
          <VideoSearchResults results={videoResults} isLoading={searchLoading} onSelect={createFromVideo} />
        ) : (
          <>
            {/* ── Hero CTA ──────────────────────────────────── */}
            <HomeCTA onPress={handleSourcePicker} />

            {/* ── Divider ───────────────────────────────────── */}
            <View style={s.divider} />

            {/* ── Rooms grid ────────────────────────────────── */}
            <View style={s.roomsWrap}>
              {roomsLoading && allRooms.length === 0 ? (
                <>
                  <View style={s.roomsSectionHeader}>
                    <Text style={s.roomsSectionLabel}>XONALAR</Text>
                  </View>
                  <View style={{ gap: CARD_GAP }}>
                    <View style={{ flexDirection: 'row', gap: CARD_GAP }}>
                      <SkeletonGridCard /><SkeletonGridCard />
                    </View>
                    <View style={{ flexDirection: 'row', gap: CARD_GAP }}>
                      <SkeletonGridCard /><SkeletonGridCard />
                    </View>
                  </View>
                </>
              ) : allRooms.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyIconRing}>
                    <Ionicons name="tv-outline" size={44} color={colors.primary + '70'} />
                  </View>
                  <Text style={s.emptyTitle}>{t('watchParty', 'noRoomsTitle')}</Text>
                  <Text style={s.emptySub}>{t('watchParty', 'noRoomsSub')}</Text>
                  <TouchableOpacity style={s.emptyAction} onPress={handleSourcePicker} activeOpacity={0.8}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                    <Text style={s.emptyActionText}>{t('watchParty', 'createRoom')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {activeRooms.length > 0 && (
                    <View style={s.roomsSectionBlock}>
                      <View style={s.roomsSectionHeader}>
                        <Text style={s.roomsSectionLabel}>{t('watchParty', 'activeRooms').toUpperCase()}</Text>
                        <View style={s.roomCountBadge}>
                          <Text style={s.roomCountText}>{activeRooms.length}</Text>
                        </View>
                      </View>
                      <RoomGrid
                        rooms={activeRooms}
                        onPress={handleRoomPress}
                        onLongPress={(id) => setReportRoomId(id)}
                      />
                    </View>
                  )}

                  {endedRooms.length > 0 && (
                    <View style={s.roomsSectionBlock}>
                      <View style={s.roomsSectionHeader}>
                        <Text style={[s.roomsSectionLabel, { color: colors.textDim }]}>
                          {t('watchParty', 'endedRooms').toUpperCase()}
                        </Text>
                        <View style={[s.roomCountBadge, { backgroundColor: colors.bgMuted }]}>
                          <Text style={[s.roomCountText, { color: colors.textDim }]}>{endedRooms.length}</Text>
                        </View>
                      </View>
                      <RoomGrid
                        rooms={endedRooms}
                        onPress={handleRoomPress}
                        onLongPress={(id) => setReportRoomId(id)}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        )}

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
      </ScrollView>

      <ReportRoomModal
        visible={!!reportRoomId}
        roomId={reportRoomId ?? ''}
        onClose={() => setReportRoomId(null)}
      />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  topGlow: { position: 'absolute', top: 0, left: 0, right: 0 },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  notifBtn: { padding: 4 },
  notifBox: {
    width: 44, height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: colors.error,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.bgBase,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },

  // ── Search ──────────────────────────────────────────────────────
  searchRow:        { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md, height: 48,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  searchBoxFocused: { borderColor: colors.primary + '60', backgroundColor: colors.bgSurface },
  searchInput:      { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 0 },

  // ── Creating banner ──────────────────────────────────────────────
  creatingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  creatingText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  scrollContent: { flexGrow: 1 },

  // Divider
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg, marginVertical: spacing.md },

  // ── Rooms grid section ───────────────────────────────────────────
  roomsWrap:          { paddingHorizontal: spacing.xl },
  roomsSectionBlock:  { marginBottom: spacing.lg },
  roomsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  roomsSectionLabel:  { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.3 },
  roomCountBadge: {
    backgroundColor: colors.bgElevated,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1,
    borderWidth: 1, borderColor: colors.border,
  },
  roomCountText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },

  // ── Empty state ──────────────────────────────────────────────────
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl,
    gap: spacing.sm, minHeight: 220,
  },
  emptyIconRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle:      { ...typography.h3, color: colors.textSecondary, textAlign: 'center' },
  emptySub:        { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.primary + '55',
    backgroundColor: colors.primary + '12',
  },
  emptyActionText: { ...typography.body, color: colors.primary, fontWeight: '600' },
}));
