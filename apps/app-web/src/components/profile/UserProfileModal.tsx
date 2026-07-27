'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSendFriendRequest } from '@/hooks/use-friends';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';
import type { IUser } from '@/types';

interface Props {
  /** `null` closes the modal — callers just clear the id they're holding. */
  userId: string | null;
  onClose: () => void;
}

// Deliberately NOT the 'user-public' key use-watch-party.ts writes: that one caches a trimmed
// { username, avatar } pair for the member list, and this modal needs the whole profile.
async function fetchProfile(userId: string): Promise<IUser> {
  const res = await fetch(`/api/user/${userId}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Profile request failed (${res.status})`);
  const body = await res.json() as { data?: IUser };
  if (!body.data) throw new Error('Profile response had no data');
  return body.data;
}

export function UserProfileModal({ userId, onClose }: Props) {
  const t = useTranslations('friends');
  const parseError = useApiError();
  const tc = useTranslations('common');
  const currentUser = useAuthStore((s) => s.user);
  const sendRequest = useSendFriendRequest();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const isSelf = Boolean(userId) && userId === currentUser?._id;

  async function handleAddFriend() {
    if (!userId) return;
    trackClick('profile-modal:add_friend');
    try {
      await sendRequest.mutateAsync(userId);
      toast.success(t('requestSentToast'));
      onClose();
    } catch (err) {
      toast.error(parseError(err, t('requestError')));
    }
  }

  const name = profile?.username || (userId ? `#${userId.slice(-4)}` : '');

  return (
    <Dialog open={Boolean(userId)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xs liquid-glass border-white/[0.08] p-6">
        <DialogTitle className="sr-only">{name}</DialogTitle>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-zinc-500" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-zinc-400 text-center py-8">{tc('error')}</p>
        )}

        {profile && (
          <div className="flex flex-col items-center gap-3">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
              <img src={profile.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: avatarColor(profile.username ?? '?') }}
              >
                {(profile.username?.[0] ?? '?').toUpperCase()}
              </div>
            )}

            <div className="text-center">
              <p className="text-white font-semibold">{name}</p>
              {profile.isOnline && (
                <p className="text-[11px] text-emerald-400 mt-0.5">{t('online')}</p>
              )}
            </div>

            {profile.bio && (
              <p className="text-xs text-zinc-400 text-center break-words">{profile.bio}</p>
            )}

            {/* Own avatar in the member list is clickable too — showing "add yourself" there would
                be nonsense, so the action simply isn't rendered. */}
            {!isSelf && (
              <button
                type="button"
                onClick={handleAddFriend}
                disabled={sendRequest.isPending}
                className="mt-1 w-full h-9 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {sendRequest.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <UserPlus size={14} />}
                {t('addFriend')}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
