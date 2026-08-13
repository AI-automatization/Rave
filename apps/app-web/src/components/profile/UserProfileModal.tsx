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
      <DialogContent className="max-w-xs rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-6 text-[var(--ww-text)]">
        <DialogTitle className="sr-only">{name}</DialogTitle>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} aria-hidden="true" className="animate-spin text-[var(--ww-text-4)]" />
          </div>
        )}

        {isError && (
          <p className="py-8 text-center text-[13px] text-[var(--ww-text-3)]">{tc('error')}</p>
        )}

        {profile && (
          <div className="flex flex-col items-center gap-3">
            {(() => {
              const color = avatarColor(profile.username ?? '?');
              return (
                <span
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-[26px] font-semibold"
                  style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
                >
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
                    <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (profile.username?.[0] ?? '?').toUpperCase()
                  )}
                </span>
              );
            })()}

            <div className="text-center">
              <p className="text-[15px] font-semibold text-[var(--ww-text)]">{name}</p>
              {profile.isOnline && (
                <p className="mt-0.5 text-[11.5px] text-[var(--ww-online)]">{t('online')}</p>
              )}
            </div>

            {profile.bio && (
              <p className="break-words text-center text-[12.5px] leading-relaxed text-[var(--ww-text-3)]">
                {profile.bio}
              </p>
            )}

            {/* Own avatar in the member list is clickable too — showing "add yourself" there would
                be nonsense, so the action simply isn't rendered. */}
            {!isSelf && (
              <button
                type="button"
                onClick={handleAddFriend}
                disabled={sendRequest.isPending}
                className="ww-btn-accent mt-1 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--ww-r-md)] text-[14px] font-medium text-white disabled:cursor-default"
              >
                {sendRequest.isPending
                  ? <Loader2 size={15} aria-hidden="true" className="animate-spin" />
                  : <UserPlus size={15} aria-hidden="true" />}
                {t('addFriend')}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
