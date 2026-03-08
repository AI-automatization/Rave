'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import { useTranslations } from 'next-intl';
import type { ApiResponse, IWatchPartyRoom } from '@/types';

export default function CreatePartyPage() {
  const t = useTranslations('party');
  const router = useRouter();
  const searchParams = useSearchParams();
  const movieId    = searchParams.get('movieId');
  const videoUrl   = searchParams.get('videoUrl');
  const videoTitle = searchParams.get('videoTitle');
  const videoThumb = searchParams.get('videoThumbnail');
  const platform   = searchParams.get('videoPlatform');

  useEffect(() => {
    if (!movieId && !videoUrl) {
      router.replace('/movies');
      return;
    }

    const create = async () => {
      try {
        const body = movieId
          ? { movieId }
          : {
              videoUrl,
              videoTitle:     videoTitle ?? undefined,
              videoThumbnail: videoThumb ?? undefined,
              videoPlatform:  platform   ?? undefined,
            };

        const res = await apiClient.post<ApiResponse<IWatchPartyRoom>>(
          '/watch-party/rooms',
          body,
        );
        const room = res.data.data;
        if (!room?._id) {
          router.replace(movieId ? `/watch/${movieId}` : '/home');
          return;
        }
        router.replace(`/party/${room._id}`);
      } catch (err) {
        logger.error('Watch Party xonasini yaratishda xato', err);
        router.replace(movieId ? `/watch/${movieId}` : '/home');
      }
    };

    void create();
  }, [movieId, videoUrl, videoTitle, videoThumb, platform, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="text-base-content/60">{t('creating')}</p>
    </div>
  );
}
