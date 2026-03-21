// CineSync Mobile — WatchPartyCreateScreen (modern design + animations)
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { ModalStackParamList } from '@app-types/index';
import { useWatchPartyCreate } from '@hooks/useWatchPartyCreate';
import { FilmSelector } from '@components/watchParty/FilmSelector';
import { FriendPicker } from '@components/watchParty/FriendPicker';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;

const { width: SCREEN_W } = Dimensions.get('window');

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

export function WatchPartyCreateScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const wp = useWatchPartyCreate();
  const { colors } = useTheme();
  const s = useStyles();

  // FAB create button scale animation
  const btnScale = useRef(new Animated.Value(1)).current;

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
    <View style={s.root}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.primary + '20', colors.bgBase]}
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

      {/* Create | Join tabs */}
      <FadeSlideIn delay={100}>
        <View style={s.modeTabs}>
          <View style={[s.modeTab, s.modeTabActive]}>
            <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={[s.modeTabText, s.modeTabTextActive]}>Yaratish</Text>
          </View>
          <TouchableOpacity
            style={s.modeTab}
            onPress={() => navigation.navigate('WatchPartyJoin')}
            activeOpacity={0.8}
          >
            <Ionicons name="enter-outline" size={16} color={colors.textMuted} />
            <Text style={s.modeTabText}>Kod orqali</Text>
          </TouchableOpacity>
        </View>
      </FadeSlideIn>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Film selection */}
        <FadeSlideIn delay={150}>
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

        {/* Room name */}
        <FadeSlideIn delay={200}>
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

        {/* Private toggle + Max members */}
        <FadeSlideIn delay={250}>
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
                  <Text
                    style={[s.memberChipText, wp.maxMembers === n && s.memberChipTextActive]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeSlideIn>

        {/* Friends */}
        <FadeSlideIn delay={300}>
          <FriendPicker
            friends={wp.friends}
            selectedFriendIds={wp.selectedFriendIds}
            selectedFriends={wp.selectedFriends}
            onToggleFriend={wp.toggleFriend}
          />
        </FadeSlideIn>

        {/* Info card */}
        <FadeSlideIn delay={350}>
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

  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.sm,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  modeTabActive: {
    backgroundColor: colors.primary + '20',
  },
  modeTabText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  modeTabTextActive: { color: colors.primary },

  // Content
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: { ...typography.label, color: colors.textMuted },

  // Input
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

  // Toggle card
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

  // Max members
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

  // Info card
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

  // Footer
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
}));
