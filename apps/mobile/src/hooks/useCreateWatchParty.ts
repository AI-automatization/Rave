// WeWatch — Hook for creating a watch party room from video search
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { watchPartyApi } from '@api/watchParty.api';
import type { VideoSearchItem } from '@api/content.api';
import type { RootStackParamList } from '@app-types/index';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function useCreateWatchParty(onSuccess?: () => void) {
  const rootNav = useNavigation<RootNav>();
  const [creating, setCreating] = useState(false);

  const createFromVideo = useCallback(async (item: VideoSearchItem) => {
    if (creating) return;
    setCreating(true);
    try {
      const room = await watchPartyApi.createRoom({
        videoUrl:       item.url,
        videoTitle:     item.title,
        videoThumbnail: item.thumbnail || undefined,
        videoPlatform:  item.platform,
      });
      onSuccess?.();
      rootNav.navigate('Modal', { screen: 'WatchParty', params: { roomId: room._id } });
    } catch {
      Alert.alert('Xato', 'Xona yaratib bo\'lmadi');
    } finally {
      setCreating(false);
    }
  }, [creating, rootNav, onSuccess]);

  return { creating, createFromVideo };
}
