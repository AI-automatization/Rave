'use client';

import { X } from 'lucide-react';

interface Props {
  senderName: string;
  text: string;
  onCancel: () => void;
}

// Bar shown above the composer while replying — port of mobile's ReplyPreviewBar.tsx.
export function ReplyPreviewBar({ senderName, text, onCancel }: Props) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.07]"
      style={{ background: '#15152a' }}
    >
      <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ backgroundColor: '#7B72F8' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold truncate" style={{ color: '#9C93FF' }}>{senderName}</p>
        <p className="text-[12px] text-white/50 truncate">{text}</p>
      </div>
      <button
        onClick={onCancel}
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
        aria-label="Cancel reply"
      >
        <X size={15} />
      </button>
    </div>
  );
}
