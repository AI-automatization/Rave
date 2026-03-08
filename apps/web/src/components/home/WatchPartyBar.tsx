'use client';

import { useState } from 'react';
import { FaPlay, FaLink } from 'react-icons/fa';
import { CreateRoomModal } from '@/components/party/CreateRoomModal';

export function WatchPartyBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111118] border border-[#7C3AED]/20 rounded-2xl">
        <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center shrink-0">
          <FaPlay size={11} className="text-[#7C3AED] ml-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Watch Party boshlash</p>
          <p className="text-xs text-slate-500">Istalgan platformadan link qo&apos;shing</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] text-xs font-semibold hover:bg-[#7C3AED]/20 transition-colors"
        >
          <FaLink size={11} />
          URL qo&apos;shish
        </button>
      </div>

      {open && <CreateRoomModal onClose={() => setOpen(false)} />}
    </>
  );
}
