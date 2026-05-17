// CineSync Mobile — Home Screen
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
  Alert,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportRoomModal } from '@components/common/ReportRoomModal';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { HomeStackParamList, RootStackParamList, IWatchPartyRoom, WatchPartyStatus } from '@app-types/index';
import { useDebounce } from '@hooks/useSearch';
import { useVideoSearch } from '@hooks/useVideoSearch';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { watchPartyApi } from '@api/watchParty.api';
import type { VideoSearchItem } from '@api/content.api';
import { VideoSearchResults } from '@components/home/VideoSearchResults';
import { HomeCTA } from '@components/home/HomeCTA';
import { WeWatchLogo } from '@components/common/WeWatchLogo';
import { useNotificationStore } from '@store/notification.store';
import { useT } from '@i18n/index';
import type { translations } from '@i18n/index';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP  = spacing.sm;
const CARD_W    = (SCREEN_W - spacing.xl * 2 - CARD_GAP) / 2;
const CARD_H    = CARD_W * 1.48;

type HomeNav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;
type TFn     = (section: keyof typeof translations, key: string) => string;

const TAB_BAR_HEIGHT = 60;

const STATUS_MAP: Record<WatchPartyStatus, { colorKey: 'success' | 'warning' | 'secondary' | 'textDim' }> = {
  waiting: { colorKey: 'warning' },
  playing: { colorKey: 'success' },
  paused:  { colorKey: 'secondary' },
  ended:   { colorKey: 'textDim' },
};

// ─── Skeleton grid card ───────────────────────────────────────────────────────

function SkeletonGridCard() {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.65, duration: 720, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.28, duration: 720, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={{
      width: CARD_W,
      height: CARD_H,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      opacity: anim,
    }} />
  );
}

// ─── Room grid card ───────────────────────────────────────────────────────────

function RoomGridCard({ room, index, onPress, onLongPress }: {
  room: IWatchPartyRoom;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { colors } = useTheme();

  const opacity    = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0.86)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.85)).current;

  const memberCount = room.memberCount ?? room.members?.length ?? 0;
  const isPlaying   = room.status === 'playing';
  const isPaused    = room.status === 'paused';
  const isWaiting   = room.status === 'waiting';
  const isEnded     = room.status === 'ended';

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,   { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 95, friction: 11 }),
      ]).start();
    }, index * 55);
    return () => clearTimeout(timer);
  }, [index, opacity, cardScale]);

  useEffect(() => {
    if (!isPlaying) return;
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 2.6,  duration: 850, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 850, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1,    duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.85, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(350),
      ])
    ).start();
  }, [isPlaying, pulseScale, pulseOpacity]);

  const onPressIn  = () =>
    Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: true, tension: 300, friction: 15 }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, tension: 180, friction: 10 }).start();

  const combinedScale = Animated.multiply(cardScale, pressScale);

  const borderColor = isPlaying
    ? colors.success + '45'
    : isPaused
      ? colors.secondary + '35'
      : colors.border;

  return (
    <Animated.View style={{ opacity, transform: [{ scale: combinedScale }], width: CARD_W }}>
      <TouchableOpacity
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor,
          opacity: isEnded ? 0.42 : 1,
        }}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        disabled={isEnded}
      >
        {/* Thumbnail */}
        {room.videoThumbnail ? (
          <Image
            source={{ uri: room.videoThumbnail }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons
              name={isPlaying ? 'play-circle' : isEnded ? 'checkmark-circle-outline' : 'film-outline'}
              size={44}
              color={isPlaying ? colors.primary + '88' : colors.textDim}
            />
          </View>
        )}

        {/* Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.94)']}
          locations={[0.22, 0.58, 1]}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingHorizontal: spacing.sm,
            paddingBottom: spacing.sm,
            paddingTop: spacing.xl * 1.6,
            gap: 4,
          }}
        >
          {/* Top badges */}
          {isPlaying && (
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.88)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3 }}>
              <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', transform: [{ scale: pulseScale }], opacity: pulseOpacity }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
              </View>
              <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800', letterSpacing: 0.7 }}>LIVE</Text>
            </View>
          )}

          {isWaiting && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.warning + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3, borderWidth: 1, borderColor: colors.warning + '40' }}>
              <Text style={{ fontSize: 9, color: colors.warning, fontWeight: '700', letterSpacing: 0.5 }}>KUTMOQDA</Text>
            </View>
          )}

          {isPaused && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.secondary + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3, borderWidth: 1, borderColor: colors.secondary + '40' }}>
              <Text style={{ fontSize: 9, color: colors.secondary, fontWeight: '700', letterSpacing: 0.5 }}>TO'XTATILGAN</Text>
            </View>
          )}

          {isEnded && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3 }}>
              <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 }}>TUGAGAN</Text>
            </View>
          )}

          {/* Title */}
          <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700', lineHeight: 16 }} numberOfLines={2}>
            {room.videoTitle ?? room.name ?? 'Watch Party'}
          </Text>

          {/* Meta row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <Ionicons name="people" size={11} color="rgba(255,255,255,0.58)" />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', fontWeight: '500' }}>
              {memberCount}/{room.maxMembers}
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons
              name={room.isPrivate ? 'lock-closed' : 'globe-outline'}
              size={11}
              color={room.isPrivate ? colors.warning + 'BB' : colors.success + 'BB'}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Room grid (2 cols, odd last item full width) ─────────────────────────────

function RoomGrid({ rooms, onPress, onLongPress }: {
  rooms: IWatchPartyRoom[];
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const rows: IWatchPartyRoom[][] = [];
  for (let i = 0; i < rooms.length; i += 2) {
    rows.push(rooms.slice(i, i + 2));
  }
  return (
    <View style={{ gap: CARD_GAP }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: CARD_GAP }}>
          {row.map((room, ci) => (
            <RoomGridCard
              key={room._id}
              room={room}
              index={ri * 2 + ci}
              onPress={() => onPress(room._id)}
              onLongPress={() => onLongPress(room._id)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

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
  const [creating,      setCreating]      = useState(false);
  const [reportRoomId,  setReportRoomId]  = useState<string | null>(null);

  const bellAnim   = useRef(new Animated.Value(0)).current;
  const prevUnread = useRef(0);

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

  const handleVideoSelect = useCallback(async (item: VideoSearchItem) => {
    if (creating) return;
    setCreating(true);
    try {
      const room = await watchPartyApi.createRoom({
        videoUrl:       item.url,
        videoTitle:     item.title,
        videoThumbnail: item.thumbnail || undefined,
        videoPlatform:  item.platform,
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
          <VideoSearchResults results={videoResults} isLoading={searchLoading} onSelect={handleVideoSelect} />
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
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

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
