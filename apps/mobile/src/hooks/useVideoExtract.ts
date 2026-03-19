// CineSync Mobile — Video extract state + handlers
import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { contentApi } from '@api/content.api';
import type { VideoExtractResult } from '@api/content.api';
import type { RootStackParamList } from '@app-types/index';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export type ExtractState = 'input' | 'loading' | 'error' | 'ready';

export const PLATFORM_LABELS: Record<VideoExtractResult['platform'], string> = {
  youtube:     'YouTube',
  vimeo:       'Vimeo',
  tiktok:      'TikTok',
  dailymotion: 'Dailymotion',
  rutube:      'Rutube',
  facebook:    'Facebook',
  instagram:   'Instagram',
  twitch:      'Twitch',
  vk:          'VK Video',
  streamable:  'Streamable',
  reddit:      'Reddit',
  twitter:     'Twitter/X',
  generic:     'Video',
  unknown:     'Video',
};

interface UseVideoExtractReturn {
  url: string;
  setUrl: (url: string) => void;
  state: ExtractState;
  errorMsg: string;
  result: VideoExtractResult | null;
  playerUrl: string;
  handleExtract: () => Promise<void>;
  handleReset: () => void;
  handleWatchParty: () => void;
}

export function useVideoExtract(): UseVideoExtractReturn {
  const rootNav = useNavigation<RootNav>();

  const [url, setUrl] = useState('');
  const [state, setState] = useState<ExtractState>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<VideoExtractResult | null>(null);

  const playerUrl = result
    ? result.useProxy ? url : result.videoUrl
    : '';

  const handleExtract = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMsg('URL http:// yoki https:// bilan boshlanishi kerak');
      setState('error');
      return;
    }
    setState('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const extracted = await contentApi.extractVideo(trimmed);
      setResult(extracted);
      setState('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setErrorMsg(
        msg.includes('Invalid URL')
          ? 'Noto\'g\'ri URL format'
          : msg.includes('Private')
            ? 'Xususiy yoki ichki URL ruxsat etilmagan'
            : 'Video topilmadi. Boshqa URL sinab ko\'ring',
      );
      setState('error');
    }
  }, [url]);

  const handleReset = useCallback(() => {
    setState('input');
    setErrorMsg('');
    setResult(null);
  }, []);

  const handleWatchParty = useCallback(() => {
    rootNav.navigate('Modal', { screen: 'WatchPartyCreate' });
  }, [rootNav]);

  return { url, setUrl, state, errorMsg, result, playerUrl, handleExtract, handleReset, handleWatchParty };
}
