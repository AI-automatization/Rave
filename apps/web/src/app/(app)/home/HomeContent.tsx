'use client';

import { useState } from 'react';
import { Plus, LogIn, Loader2, Tv } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRooms } from '@/hooks/use-rooms';
import { RoomCard } from '@/components/rooms/RoomCard';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog';

export function HomeContent() {
  const t = useTranslations('home');
  const { data: rooms, isLoading } = useRooms();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setJoinOpen(true)}
            className="h-9 px-4 rounded-lg text-sm font-medium text-slate-300 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogIn size={14} />
            {t('join')}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            <Plus size={14} />
            {t('create')}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!rooms || rooms.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center">
            <Tv size={28} className="text-violet-400" />
          </div>
          <p className="text-slate-400 text-sm">{t('empty')}</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="h-9 px-5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            <Plus size={14} />
            {t('createFirst')}
          </button>
        </div>
      )}

      {/* Room grid */}
      {rooms && rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
