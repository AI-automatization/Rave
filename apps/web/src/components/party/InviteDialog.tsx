'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('party');
  const room = useWatchPartyStore((s) => s.room);
  const [copied, setCopied] = useState(false);

  const inviteCode = room?.inviteCode ?? '';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F0E1A] border-[#1E1D2E] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{t('inviteFriends')}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Bu kodni do&apos;stlaringizga yuboring
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-12 bg-[#13121F] border border-[#2A2840] rounded-xl flex items-center justify-center text-xl font-bold tracking-[0.3em] text-white">
            {inviteCode}
          </div>
          <button
            onClick={handleCopy}
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {copied && (
          <p className="text-xs text-emerald-400 text-center">{t('copied')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
