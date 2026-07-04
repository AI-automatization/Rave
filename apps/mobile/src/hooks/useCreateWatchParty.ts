// WeWatch — Hook for creating a watch party room from video search
import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { showAlert } from '@components/common/AppAlert';
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
    } catch (err: unknown) {
      // Backend enforces one active room per owner (409 ROOM_ALREADY_EXISTS).
      // Instead of erroring, reopen the room the user already has.
      const resp = (err as {
        response?: { status?: number; data?: { message?: string; data?: { roomId?: string } } };
      }).response;
      const existingId =
        resp?.status === 409 && resp.data?.message === 'ROOM_ALREADY_EXISTS'
          ? resp.data.data?.roomId
          : undefined;
      if (existingId) {
        onSuccess?.();
        showAlert({
          title: 'Sizda faol xona bor',
          message: 'Mavjud xonangiz ochilmoqda.',
          buttons: [
            {
              text: 'OK',
              onPress: () =>
                rootNav.navigate('Modal', { screen: 'WatchParty', params: { roomId: existingId } }),
            },
          ],
        });
        return;
      }
      showAlert({ title: 'Xato', message: 'Xona yaratib bo\'lmadi' });
    } finally {
      setCreating(false);
    }
  }, [creating, rootNav, onSuccess]);

  return { creating, createFromVideo };
}
