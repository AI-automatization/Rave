// WeWatch — useSourcePicker: URL extraction, source navigation, room creation
import { useState } from 'react';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useT } from '@i18n/index';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { contentApi } from '@api/content.api';
import { watchPartyApi, RoomAlreadyExistsError } from '@api/watchParty.api';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import type { MediaSource } from '@constants/mediaSources';
import type { ModalStackParamList } from '@app-types/index';
import { appAlert } from '@components/common/AppAlert';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'SourcePicker'>;

export function useSourcePicker() {
  const { t } = useT();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteType>();

  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  function handleSourcePress(source: MediaSource) {
    if (source.support === 'internal') {
      appAlert(source.label, t('watchParty', 'comingSoonFeature'), [{ text: t('common', 'ok') }]);
      return;
    }
    if (source.support === 'drm') {
      appAlert(
        `🔒 ${source.label}`,
        source.drmMessage ?? t('watchParty', 'drmNotSupported'),
        [{ text: t('watchParty', 'understood') }],
      );
      return;
    }
    navigation.navigate('MediaWebView', {
      sourceId: source.id,
      sourceName: source.label,
      defaultUrl: source.defaultUrl,
      mode: params.mode,
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
      // Always store the original URL, not the extracted stream URL.
      // Each client re-extracts on join so they get their own fresh proxy URL.
      if (params.mode === 'change') {
        if (!params.roomId) return;
        getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
          roomId: params.roomId,
          videoUrl: trimmed,
          videoTitle: extracted.title || trimmed,
          videoPlatform: extracted.platform,
        });
        navigation.navigate('WatchParty', { roomId: params.roomId });
        return;
      }
      if (params.mode === 'queue') {
        if (!params.roomId) return;
        await watchPartyApi.addToPlaylist(params.roomId, {
          videoUrl: trimmed,
          videoTitle: extracted.title || trimmed,
          videoPlatform: extracted.platform,
        });
        navigation.navigate('WatchParty', { roomId: params.roomId });
        return;
      }
      const room = await watchPartyApi.createRoom({
        name: (extracted.title || trimmed).slice(0, 60),
        videoUrl: trimmed,
        videoTitle: extracted.title || trimmed,
        videoPlatform: extracted.platform,
      });
      navigation.navigate('WatchParty', { roomId: room._id });
    } catch (err) {
      // Without this, hitting the one-room-per-owner limit here fell into the generic catch below
      // and silently opened a WebView instead of the room the user already has.
      if (err instanceof RoomAlreadyExistsError) {
        navigation.navigate('WatchParty', { roomId: err.existingRoom._id });
        return;
      }
      try {
        new URL(trimmed);
        navigation.navigate('MediaWebView', {
          sourceId: 'custom',
          sourceName: t('watchParty', 'videoDefault'),
          defaultUrl: trimmed,
          mode: params.mode,
          roomId: params.roomId,
        });
      } catch {
        setUrlError(t('watchParty', 'errorExtract'));
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
