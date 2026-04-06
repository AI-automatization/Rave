// CineSync — useSourcePicker: URL extraction, source navigation, room creation
import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { contentApi } from '@api/content.api';
import { watchPartyApi } from '@api/watchParty.api';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import type { MediaSource } from '@constants/mediaSources';
import type { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'SourcePicker'>;

export function useSourcePicker() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteType>();

  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  function handleSourcePress(source: MediaSource) {
    if (source.support === 'internal') {
      Alert.alert(source.label, 'Эта функция скоро появится в CineSync!', [{ text: 'OK' }]);
      return;
    }
    if (source.support === 'drm') {
      Alert.alert(
        `🔒 ${source.label}`,
        source.drmMessage ?? 'Этот контент защищён DRM и не может быть воспроизведён внутри приложения.',
        [{ text: 'Понятно' }],
      );
      return;
    }
    navigation.navigate('MediaWebView', {
      sourceId: source.id,
      sourceName: source.label,
      defaultUrl: source.defaultUrl,
      context: params.context,
      roomId: params.roomId,
    });
  }

  async function handleUrlExtract() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setUrlError(null);
    setIsExtracting(true);
    try {
      const extracted = await contentApi.extractVideo(trimmed);
      if (params.context === 'change_media') {
        if (!params.roomId) return;
        getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
          roomId: params.roomId,
          videoUrl: extracted.videoUrl,
          videoTitle: extracted.title || trimmed,
          videoPlatform: extracted.platform,
        });
        navigation.navigate('WatchParty', { roomId: params.roomId });
        return;
      }
      const room = await watchPartyApi.createRoom({
        name: (extracted.title || trimmed).slice(0, 60),
        videoUrl: extracted.videoUrl,
        videoTitle: extracted.title || trimmed,
        videoPlatform: extracted.platform,
      });
      navigation.navigate('WatchParty', { roomId: room._id });
    } catch {
      try {
        new URL(trimmed);
        navigation.navigate('MediaWebView', {
          sourceId: 'custom',
          sourceName: 'Видео',
          defaultUrl: trimmed,
          context: params.context,
          roomId: params.roomId,
        });
      } catch {
        setUrlError('Не удалось извлечь видео. Проверьте ссылку.');
      }
    } finally {
      setIsExtracting(false);
    }
  }

  function handleCreateRoom() {
    navigation.navigate('WatchPartyCreate');
  }

  function handleUrlChange(text: string) {
    setUrlInput(text);
    setUrlError(null);
  }

  return {
    params,
    urlInput, isExtracting, urlError,
    handleSourcePress, handleUrlExtract, handleCreateRoom, handleUrlChange,
  };
}
