'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { VideoSearch } from '@/components/rooms/VideoSearch';
import { useCreateRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';
import type { IExternalVideo } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const createRoom = useCreateRoom();
  const [videoUrl, setVideoUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selected, setSelected] = useState<IExternalVideo | null>(null);

  function handleSelect(video: IExternalVideo) {
    setSelected(video);
    setVideoUrl(video.url);
  }

  async function handleCreate() {
    try {
      const res = await createRoom.mutateAsync({
        name: roomName || undefined,
        videoUrl: selected?.url ?? (videoUrl || undefined),
        videoTitle: selected?.title ?? undefined,
        videoThumbnail: selected?.thumbnail ?? undefined,
        videoPlatform: selected?.platform ?? undefined,
      });
      onOpenChange(false);
      const roomId = res.data?.room?._id;
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch {
      toast.error('Xona yaratib bo\'lmadi');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F0E1A] border-[#1E1D2E] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Watch Party yaratish</DialogTitle>
          <DialogDescription className="text-slate-400">
            Video qidiring yoki URL kiriting
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Room name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Xona nomi (ixtiyoriy)</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full h-10 bg-[#13121F] border border-[#2A2840] rounded-xl px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          {/* Video URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); setSelected(null); }}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full h-10 bg-[#13121F] border border-[#2A2840] rounded-xl px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          {/* Video search */}
          <VideoSearch onSelect={handleSelect} />

          {/* Selected video */}
          {selected && (
            <div className="flex items-center gap-3 bg-violet-500/[0.08] border border-violet-500/20 rounded-xl p-2.5">
              {selected.thumbnail && (
                <img src={selected.thumbnail} alt="" className="w-16 h-10 rounded object-cover" />
              )}
              <span className="text-sm text-white truncate flex-1">{selected.title}</span>
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={createRoom.isPending}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            {createRoom.isPending
              ? <><Loader2 size={15} className="animate-spin" />Yaratilmoqda...</>
              : 'Yaratish'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
