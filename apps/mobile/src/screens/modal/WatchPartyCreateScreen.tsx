// CineSync Mobile — WatchPartyCreateScreen (3-tab: Rooms / Create / Join)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { ModalStackParamList } from '@app-types/index';
import { useWatchPartyCreate } from '@hooks/useWatchPartyCreate';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { watchPartyApi } from '@api/watchParty.api';
import { FilmSelector } from '@components/watchParty/FilmSelector';
import { FriendPicker } from '@components/watchParty/FriendPicker';
import { RoomCard } from '@components/watchParty/RoomCard';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;
type TabKey = 'rooms' | 'create' | 'join';

const CODE_LENGTH = 6;

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'rooms', icon: 'globe-outline', label: 'Xonalar' },
  { key: 'create', icon: 'add-circle-outline', label: 'Yaratish' },
  { key: 'join', icon: 'key-outline', label: 'Kod' },
];

// ─── Animated section wrapper ───────────────────────────────────
function FadeSlideIn({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: object }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children as unknown as React.ReactElement<unknown, string>}
    </Animated.View>
  );
}

// ─── Rooms Tab ──────────────────────────────────────────────────
function RoomsTab({ navigation }: { navigation: Nav }) {
  const { data: rooms, isLoading, refetch, isRefetching } = useWatchPartyRooms();
  const { colors } = useTheme();
  const s = useStyles();

  const activeRooms = (rooms ?? []).filter(r => r.status !== 'ended');
  const endedRooms = (rooms ?? []).filter(r => r.status === 'ended');

  const handleRoomPress = (roomId: string) => {
    navigation.replace('WatchParty', { roomId });
  };

  if (isLoading) {
    return (
      <View style={s.emptyWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={s.emptyWrap}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View style={s.emptyIcon}>
          <Ionicons name="tv-outline" size={56} color={colors.textDim} />
        </View>
        <Text style={s.emptyTitle}>Hozircha xonalar yo'q</Text>
        <Text style={s.emptySub}>
          Birinchi bo'lib xona yarating yoki invite kod bilan qo'shiling!
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.roomsContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Active rooms count */}
      <FadeSlideIn delay={50}>
        <View style={s.roomsHeader}>
          <View style={s.roomsCountBadge}>
            <View style={[s.liveDot, { backgroundColor: colors.success }]} />
            <Text style={s.roomsCountText}>
              {activeRooms.length} ta faol xona
            </Text>
          </View>
        </View>
      </FadeSlideIn>

      {/* Active rooms */}
      {activeRooms.map((room, i) => (
        <RoomCard key={room._id} room={room} index={i} onPress={handleRoomPress} />
      ))}

      {/* Ended rooms */}
      {endedRooms.length > 0 && (
        <>
          <FadeSlideIn delay={activeRooms.length * 80 + 100}>
            <Text style={s.endedLabel}>Tugagan xonalar</Text>
          </FadeSlideIn>
          {endedRooms.map((room, i) => (
            <RoomCard key={room._id} room={room} index={activeRooms.length + i} onPress={handleRoomPress} />
          ))}
        </>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

// ─── Create Tab ─────────────────────────────────────────────────
function CreateTab({ navigation }: { navigation: Nav }) {
  const wp = useWatchPartyCreate();
  const { colors } = useTheme();
  const s = useStyles();
  const btnScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const onCreateSuccess = (roomId: string) => {
    navigation.replace('WatchParty', { roomId });
  };

  const handleCreatePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    wp.handleCreate(onCreateSuccess);
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeSlideIn delay={100}>
          <FilmSelector
            filmMode={wp.filmMode}
            onSwitchToCatalog={wp.switchToCatalog}
            onSwitchToUrl={wp.switchToUrl}
            selectedMovie={wp.selectedMovie}
            onSelectMovie={wp.selectMovie}
            onClearMovie={wp.clearSelectedMovie}
            searchQuery={wp.searchQuery}
            onSearchChange={wp.setSearchQuery}
            searching={wp.searching}
            searchResults={wp.searchResults}
            videoUrl={wp.videoUrl}
            onVideoUrlChange={wp.setVideoUrl}
            isExtracting={wp.isExtracting}
            extractResult={wp.extractResult}
            fallbackMode={wp.fallbackMode}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={150}>
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="text-outline" size={16} color={colors.primary} />
              <Text style={s.label}>XONA NOMI</Text>
            </View>
            <TextInput
              style={s.input}
              value={wp.roomName}
              onChangeText={wp.setRoomName}
              placeholder="Masalan: Kecha filmlar kechasi"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />
            <Text style={s.charCount}>{wp.roomName.length}/50</Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={200}>
          <View style={s.section}>
            <View style={s.toggleCard}>
              <View style={s.toggleLeft}>
                <View style={[s.toggleIcon, { backgroundColor: colors.secondary + '15' }]}>
                  <Ionicons
                    name={wp.isPrivate ? 'lock-closed' : 'globe-outline'}
                    size={18}
                    color={colors.secondary}
                  />
                </View>
                <View>
                  <Text style={s.rowTitle}>{wp.isPrivate ? 'Shaxsiy xona' : 'Ommaviy xona'}</Text>
                  <Text style={s.rowSub}>
                    {wp.isPrivate ? 'Faqat invite kod orqali' : 'Barcha qo\'shila oladi'}
                  </Text>
                </View>
              </View>
              <Switch
                value={wp.isPrivate}
                onValueChange={wp.setIsPrivate}
                trackColor={{ false: colors.bgMuted, true: colors.primary + '80' }}
                thumbColor={wp.isPrivate ? colors.primary : colors.textSecondary}
              />
            </View>

            <View style={s.sectionHeader}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={s.label}>MAKSIMAL A'ZOLAR</Text>
            </View>
            <View style={s.membersRow}>
              {wp.maxMembersOptions.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.memberChip, wp.maxMembers === n && s.memberChipActive]}
                  onPress={() => wp.setMaxMembers(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.memberChipText, wp.maxMembers === n && s.memberChipTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={250}>
          <FriendPicker
            friends={wp.friends}
            selectedFriendIds={wp.selectedFriendIds}
            selectedFriends={wp.selectedFriends}
            onToggleFriend={wp.toggleFriend}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={300}>
          <View style={s.infoCard}>
            <View style={[s.infoIconWrap, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="information-circle" size={18} color={colors.secondary} />
            </View>
            <Text style={s.infoText}>
              Xona yaratilgach invite kod hosil bo'ladi. Tanlangan do'stlaringizga notification yuboriladi!
            </Text>
          </View>
        </FadeSlideIn>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating create button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[s.createBtn, wp.loading && s.createBtnDisabled]}
            onPress={handleCreatePress}
            disabled={wp.loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight ?? '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.createBtnGradient}
            >
              {wp.loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="play-circle" size={22} color={colors.white} />
                  <Text style={s.createBtnText}>Xona yaratish</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

// ─── Join Tab ───────────────────────────────────────────────────
function JoinTab({ navigation }: { navigation: Nav }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleChangeCode = (text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH));
  };

  const handleJoin = useCallback(async () => {
    if (code.length < CODE_LENGTH) {
      Alert.alert('Xato', `${CODE_LENGTH} belgili kod kiriting`);
      return;
    }
    setLoading(true);
    try {
      const room = await watchPartyApi.joinByInviteCode(code);
      navigation.replace('WatchParty', { roomId: room._id });
    } catch {
      Alert.alert('Xato', 'Noto\'g\'ri kod yoki xona topilmadi');
    } finally {
      setLoading(false);
    }
  }, [code, navigation]);

  return (
    <View style={s.joinContent}>
      <FadeSlideIn delay={100}>
        <View style={s.joinIconWrap}>
          <LinearGradient
            colors={[colors.secondary + '20', colors.primary + '20']}
            style={s.joinIconGradient}
          >
            <Ionicons name="key-outline" size={48} color={colors.secondary} />
          </LinearGradient>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={150}>
        <Text style={s.joinHeading}>Invite kod kiriting</Text>
      </FadeSlideIn>
      <FadeSlideIn delay={200}>
        <Text style={s.joinSub}>
          Do'stingiz yuborgan {CODE_LENGTH} belgili kodni kiriting
        </Text>
      </FadeSlideIn>

      <FadeSlideIn delay={250}>
        <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={0.9}>
          <View style={s.codeRow}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.codeBox,
                  code.length === i && s.codeBoxActive,
                  i < code.length && s.codeBoxFilled,
                ]}
              >
                <Text style={s.codeChar}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChangeCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_LENGTH}
          style={s.hiddenInput}
          autoFocus={false}
        />
      </FadeSlideIn>

      <FadeSlideIn delay={300}>
        <TouchableOpacity
          style={[s.joinBtn, (loading || code.length < CODE_LENGTH) && s.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={loading || code.length < CODE_LENGTH}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.secondary, '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.joinBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="enter-outline" size={20} color={colors.white} />
                <Text style={s.joinBtnText}>Qo'shilish</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </FadeSlideIn>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────
export function WatchPartyCreateScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const [activeTab, setActiveTab] = useState<TabKey>('rooms');

  // Tab indicator animation
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth = useRef(0);

  const handleTabPress = (tab: TabKey, index: number) => {
    setActiveTab(tab);
    Animated.spring(indicatorX, {
      toValue: index * (tabWidth.current || 100),
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary + '15', colors.bgBase]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Ionicons name="tv-outline" size={20} color={colors.primary} />
          <Text style={s.title}>Watch Party</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View
        style={s.tabBar}
        onLayout={(e) => {
          tabWidth.current = (e.nativeEvent.layout.width - spacing.lg * 2 - 8) / TABS.length;
        }}
      >
        <View style={s.tabBarInner}>
          {/* Animated indicator */}
          <Animated.View
            style={[
              s.tabIndicator,
              {
                width: `${100 / TABS.length}%` as unknown as number,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + '30', colors.primary + '15']}
              style={s.tabIndicatorGradient}
            />
          </Animated.View>

          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              style={s.tab}
              onPress={() => handleTabPress(tab.key, index)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textMuted}
              />
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab content */}
      {activeTab === 'rooms' && <RoomsTab navigation={navigation} />}
      {activeTab === 'create' && <CreateTab navigation={navigation} />}
      {activeTab === 'join' && <JoinTab navigation={navigation} />}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.h2, color: colors.textPrimary },

  // Tab bar
  tabBar: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  tabIndicatorGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    zIndex: 1,
  },
  tabText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  // Rooms tab
  roomsContent: {
    padding: spacing.lg,
  },
  roomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  roomsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roomsCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  endedLabel: {
    ...typography.label,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Create tab content
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: { ...typography.label, color: colors.textMuted },

  input: {
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 2,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { ...typography.caption, color: colors.textDim, textAlign: 'right' },

  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rowSub: { ...typography.caption, color: colors.textMuted },

  membersRow: { flexDirection: 'row', gap: spacing.sm },
  memberChip: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  memberChipText: { ...typography.body, color: colors.textMuted, fontWeight: '700' },
  memberChipTextActive: { color: colors.white },

  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.secondary + '20',
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgBase + 'E0',
  },
  createBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  createBtnText: { ...typography.h3, color: colors.white, fontWeight: '700' },

  // Join tab
  joinContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    gap: spacing.lg,
  },
  joinIconWrap: {
    marginBottom: spacing.sm,
  },
  joinIconGradient: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinHeading: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  joinSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: colors.secondary },
  codeBoxFilled: { borderColor: colors.primary, backgroundColor: colors.bgSurface },
  codeChar: { ...typography.h2, color: colors.textPrimary, letterSpacing: 2 },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  joinBtn: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  joinBtnDisabled: { opacity: 0.45 },
  joinBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  joinBtnText: { ...typography.h3, color: colors.white, fontWeight: '700' },
}));
