'use client';

import { useState } from 'react';
import { Copy, Check, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { toast } from '@/hooks/use-toast';
import type { IUser } from '@/types';
import { trackClick } from '@/lib/analytics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('party');
  const locale = useLocale();
  const room = useWatchPartyStore((s) => s.room);
  const [copied, setCopied] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [storyPending, setStoryPending] = useState(false);

  const inviteCode = room?.inviteCode ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.wewatch.uz';
  const shareUrl = room?._id ? `${appUrl}/room/${room._id}?code=${inviteCode}` : '';

  const { data: friends } = useQuery<IUser[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/user/me/friends', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json() as { data?: IUser[] };
      return Array.isArray(data.data) ? data.data : [];
    },
    enabled: open,
  });

  async function handleCopy() {
    trackClick('invite:copy_link');
    try {
      await navigator.clipboard.writeText(shareUrl || inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  // Instagram has no official web "post to story" API, so this is the closest thing available:
  // hand the generated PNG to the OS share sheet and let the user pick Instagram, where they still
  // tap "Add to story" themselves. Desktop browsers can't share files — there it degrades to a
  // plain download, which is genuinely the best a browser can do.
  async function handleShareStory() {
    if (!room?._id || storyPending) return;
    trackClick('invite:share_story');
    setStoryPending(true);
    try {
      // ?lang= — the tagline is rasterised into the PNG server-side, so the locale has to travel
      // with the request; without it every story card went out in Uzbek regardless of UI language.
      const res = await fetch(`/api/rooms/${room._id}/story-image?lang=${locale}`, { credentials: 'include' });
      if (!res.ok) throw new Error('story image failed');
      const blob = await res.blob();
      const file = new File([blob], 'wewatch-story.png', { type: 'image/png' });

      // canShare({ files }) is the only reliable probe — navigator.share exists on desktop Safari
      // but rejects file payloads, and a rejection here looks like a broken button to the user.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareUrl });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wewatch-story.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // AbortError just means the user dismissed the share sheet — not a failure worth a toast.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast({ title: t('storyShareError'), variant: 'destructive' });
      }
    } finally {
      setStoryPending(false);
    }
  }

  async function handleInvite(userId: string) {
    if (!room?._id) return;
    trackClick('invite:send_to_friend');
    setInvitingId(userId);
    try {
      const res = await fetch(`/api/rooms/${room._id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast({ title: t('inviteSent') });
      } else {
        toast({ title: t('inviteError'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('inviteError'), variant: 'destructive' });
    } finally {
      setInvitingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-white max-w-sm border-white/[0.12]"
        style={{ background: 'rgba(8,6,18,0.9)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{t('inviteFriends')}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t('inviteCodeHint')}
          </DialogDescription>
        </DialogHeader>

        {/* Invite code */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-12 border border-white/[0.1] rounded-xl flex items-center justify-center text-xl font-bold tracking-[0.3em] text-white"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {inviteCode}
          </div>
          <button
            onClick={handleCopy}
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {shareUrl && (
          <p className="text-xs text-slate-500 text-center truncate" title={shareUrl}>{shareUrl}</p>
        )}

        {copied && (
          <p className="text-xs text-emerald-400 text-center">{t('copied')}</p>
        )}

        <button
          onClick={handleShareStory}
          disabled={!room?._id || storyPending}
          className="h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 transition-colors cursor-pointer"
        >
          {storyPending
            ? <Loader2 size={15} className="animate-spin" />
            : <ImageIcon size={15} />}
          {t('shareStory')}
        </button>

        {/* Friends list */}
        {friends && friends.length > 0 && (
          <div className="flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-500 mb-1">{t('friends')}</p>
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden shrink-0">
                  {friend.avatar
                    ? <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                    : friend.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="flex-1 text-sm text-slate-300 truncate">{friend.username}</span>
                <button
                  onClick={() => handleInvite(friend._id)}
                  disabled={invitingId === friend._id}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {invitingId === friend._id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <><Send size={11} /> Invite</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {friends && friends.length === 0 && (
          <p className="text-xs text-slate-500 text-center">{t('noFriends')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
