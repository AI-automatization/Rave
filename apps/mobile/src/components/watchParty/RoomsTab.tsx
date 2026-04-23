// CineSync — Rooms tab for WatchPartyCreateScreen (T-E108 + T-E109)
import React, { useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, Alert,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, createThemedStyles, borderRadius, typography } from '@theme/index';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { useRecentRooms } from '@hooks/useRecentRooms';
import { usePublicRooms } from '@hooks/usePublicRooms';
import { watchPartyApi } from '@api/watchParty.api';
import { RoomCard } from './RoomCard';
import { FadeSlideIn } from '@components/common/FadeSlideIn';
import { useWatchPartyCreateStyles } from './watchPartyCreate.styles';
import type { ModalStackParamList, IWatchPartyRoom } from '@app-types/index';
import { translations } from '@i18n/index';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;
type TFn = (section: keyof typeof translations, key: string) => string;
type SubTab = 'my' | 'recent' | 'discover';

interface Props {
  navigation: Nav;
  t: TFn;
}

const SUB_TABS: { key: SubTab; labelKey: string; icon: string }[] = [
  { key: 'my',       labelKey: 'subTabMy',       icon: 'person-outline' },
  { key: 'recent',   labelKey: 'subTabRecent',    icon: 'time-outline' },
  { key: 'discover', labelKey: 'subTabDiscover',  icon: 'globe-outline' },
];

export function RoomsTab({ navigation, t }: Props) {
  const { colors } = useTheme();
  const s = useWatchPartyCreateStyles();
  const ls = useLocalStyles();

  const [activeTab, setActiveTab] = useState<SubTab>('my');
  const [joining, setJoining] = useState<string | null>(null);

  const myQuery     = useWatchPartyRooms();
  const recentQuery = useRecentRooms();
  const publicQuery = usePublicRooms();

  const handleRoomPress = async (roomId: string) => {
    setJoining(roomId);
    try {
      await watchPartyApi.joinRoomById(roomId);
      navigation.replace('WatchParty', { roomId });
    } catch {
      Alert.alert(t('watchParty', 'error'), t('watchParty', 'joinError'));
    } finally {
      setJoining(null);
    }
  };

  const activeQuery = activeTab === 'my' ? myQuery : activeTab === 'recent' ? recentQuery : publicQuery;
  const rooms: IWatchPartyRoom[] = activeQuery.data ?? [];

  const activeRooms = rooms.filter(r => r.status !== 'ended');
  const endedRooms  = rooms.filter(r => r.status === 'ended');

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tab segmented control */}
      <View style={ls.segWrap}>
        {SUB_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[ls.seg, isActive && ls.segActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text style={[ls.segText, isActive && ls.segTextActive]}>
                {t('watchParty', tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Discover badge */}
      {activeTab === 'discover' && (
        <FadeSlideIn delay={0}>
          <View style={ls.discoverBadge}>
            <View style={[ls.liveDot, { backgroundColor: colors.success }]} />
            <Text style={ls.discoverBadgeText}>{t('watchParty', 'discoverHint')}</Text>
          </View>
        </FadeSlideIn>
      )}

      {/* Content */}
      {activeQuery.isLoading ? (
        <View style={s.emptyWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : rooms.length === 0 ? (
        <ScrollView
          contentContainerStyle={s.emptyWrap}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={activeQuery.refetch}
              tintColor={colors.primary}
            />
          }
        >
          <View style={s.emptyIcon}>
            <Ionicons
              name={activeTab === 'discover' ? 'globe-outline' : activeTab === 'recent' ? 'time-outline' : 'tv-outline'}
              size={56}
              color={colors.textDim}
            />
          </View>
          <Text style={s.emptyTitle}>
            {t('watchParty', activeTab === 'discover' ? 'noPublicTitle' : activeTab === 'recent' ? 'noRecentTitle' : 'noRoomsTitle')}
          </Text>
          <Text style={s.emptySub}>
            {t('watchParty', activeTab === 'discover' ? 'noPublicSub' : activeTab === 'recent' ? 'noRecentSub' : 'noRoomsSub')}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={s.roomsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={activeQuery.refetch}
              tintColor={colors.primary}
            />
          }
        >
          {activeRooms.length > 0 && (
            <FadeSlideIn delay={50}>
              <View style={s.roomsHeader}>
                <View style={s.roomsCountBadge}>
                  <View style={[s.liveDot, { backgroundColor: colors.success }]} />
                  <Text style={s.roomsCountText}>
                    {activeRooms.length} {t('watchParty', 'activeCount')}
                  </Text>
                </View>
              </View>
            </FadeSlideIn>
          )}

          {activeRooms.map((room, i) => (
            <RoomCard
              key={room._id}
              room={room}
              index={i}
              onPress={joining ? () => {} : handleRoomPress}
              t={t}
            />
          ))}

          {endedRooms.length > 0 && (
            <>
              <FadeSlideIn delay={activeRooms.length * 80 + 100}>
                <Text style={s.endedLabel}>{t('watchParty', 'endedRooms')}</Text>
              </FadeSlideIn>
              {endedRooms.map((room, i) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  index={activeRooms.length + i}
                  onPress={joining ? () => {} : handleRoomPress}
                  t={t}
                />
              ))}
            </>
          )}

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      )}
    </View>
  );
}

const useLocalStyles = createThemedStyles((colors) => ({
  segWrap: {
    flexDirection: 'row' as const,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: 4,
    gap: 2,
  },
  seg: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.sm + 1,
    borderRadius: borderRadius.lg,
  },
  segActive: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  segText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600' as const,
  },
  segTextActive: {
    color: colors.primary,
  },
  discoverBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start' as const,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  discoverBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
}));
