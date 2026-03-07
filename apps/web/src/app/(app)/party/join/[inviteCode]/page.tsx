'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IWatchPartyRoom } from '@/types';

export default function JoinPartyPage() {
  const router = useRouter();
  const { inviteCode } = useParams<{ inviteCode: string }>();

  useEffect(() => {
    if (!inviteCode) {
      router.replace('/home');
      return;
    }

    const join = async () => {
      try {
        const res = await apiClient.post<ApiResponse<IWatchPartyRoom>>(
          `/watch-party/rooms/join/${inviteCode}`,
        );
        const room = res.data.data;
        if (!room?._id) {
          router.replace('/home');
          return;
        }
        router.replace(`/party/${room._id}`);
      } catch (err) {
        logger.error('Watch Party ga qo\'shilishda xato', err);
        router.replace('/home');
      }
    };

    void join();
  }, [inviteCode, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="text-base-content/60">Watch Party ga qo&apos;shilmoqda...</p>
    </div>
  );
}
