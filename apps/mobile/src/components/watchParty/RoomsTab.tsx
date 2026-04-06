// CineSync — Rooms tab for WatchPartyCreateScreen
import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@theme/index';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { watchPartyApi } from '@api/watchParty.api';
import { RoomCard } from './RoomCard';
import { FadeSlideIn } from '@components/common/FadeSlideIn';
import { useWatchPartyCreateStyles } from './watchPartyCreate.styles';
import type { ModalStackParamList } from '@app-types/index';
import { translations } from '@i18n/index';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;
type TFn = (section: keyof typeof translations, key: string) => string;

interface Props {
  navigation: Nav;
  t: TFn;
}

export function RoomsTab({ navigation, t }: Props) {
  const { data: rooms, isLoading, refetch, isRefetching } = useWatchPartyRooms();
  const { colors } = useTheme();
  const s = useWatchPartyCreateStyles();
  const [joining, setJoining] = useState<string | null>(null);

  const activeRooms = (rooms ?? []).filter(r => r.status !== 'ended');
  const endedRooms = (rooms ?? []).filter(r => r.status === 'ended');

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
        <View style={s.emptyIcon}><Ionicons name="tv-outline" size={56} color={colors.textDim} /></View>
        <Text style={s.emptyTitle}>{t('watchParty', 'noRoomsTitle')}</Text>
        <Text style={s.emptySub}>{t('watchParty', 'noRoomsSub')}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.roomsContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <FadeSlideIn delay={50}>
        <View style={s.roomsHeader}>
          <View style={s.roomsCountBadge}>
            <View style={[s.liveDot, { backgroundColor: colors.success }]} />
            <Text style={s.roomsCountText}>{activeRooms.length} {t('watchParty', 'activeCount')}</Text>
          </View>
        </View>
      </FadeSlideIn>

      {activeRooms.map((room, i) => (
        <RoomCard key={room._id} room={room} index={i} onPress={handleRoomPress} t={t} />
      ))}

      {endedRooms.length > 0 && (
        <>
          <FadeSlideIn delay={activeRooms.length * 80 + 100}>
            <Text style={s.endedLabel}>{t('watchParty', 'endedRooms')}</Text>
          </FadeSlideIn>
          {endedRooms.map((room, i) => (
            <RoomCard key={room._id} room={room} index={activeRooms.length + i} onPress={handleRoomPress} t={t} />
          ))}
        </>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}
