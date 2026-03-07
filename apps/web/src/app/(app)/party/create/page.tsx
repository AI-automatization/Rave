'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IWatchPartyRoom } from '@/types';

export default function CreatePartyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const movieId = searchParams.get('movieId');

  useEffect(() => {
    if (!movieId) {
      router.replace('/movies');
      return;
    }

    const create = async () => {
      try {
        const res = await apiClient.post<ApiResponse<IWatchPartyRoom>>(
          '/watch-party/rooms',
          { movieId },
        );
        const room = res.data.data;
        router.replace(`/party/${room._id}`);
      } catch (err) {
        logger.error('Watch Party xonasini yaratishda xato', err);
        router.replace(`/watch/${movieId}`);
      }
    };

    void create();
  }, [movieId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="text-base-content/60">Watch Party xonasi yaratilmoqda...</p>
    </div>
  );
}
