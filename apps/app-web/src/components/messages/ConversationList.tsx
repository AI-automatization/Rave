'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, MoreVertical, Pin, PinOff, Bell, BellOff, Eye, Flag, Ban } from 'lucide-react';
import type { Conversation } from '@/lib/api/user.api';
import { trackClick } from '@/lib/analytics';
import { memberColor, formatRelative } from '@/lib/dm/dm-format';
import { useToggleMute, useTogglePinConversation, useUnblockUser } from '@/hooks/use-dm';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChatPreviewModal } from '@/components/messages/dm/ChatPreviewModal';
import { ReportUserDialog } from '@/components/messages/dm/ReportUserDialog';
import { BlockUserDialog } from '@/components/messages/dm/BlockUserDialog';

interface Props {
  conversations: Conversation[];
  selectedPeerId: string | null;
  onSelect: (peerId: string) => void;
}

export function ConversationList({ conversations, selectedPeerId, onSelect }: Props) {
  const t = useTranslations('dm');
  const parseError = useApiError();
  const toggleMute = useToggleMute();
  const togglePin = useTogglePinConversation();
  const unblockUser = useUnblockUser();
  const [previewPeerId, setPreviewPeerId] = useState<string | null>(null);
  const [reportPeerId, setReportPeerId] = useState<string | null>(null);
  const [blockPeerId, setBlockPeerId] = useState<string | null>(null);

  // Pinned conversations first (stable within each group), matching mobile's ordering.
  const sorted = useMemo(
    () => [...conversations].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)),
    [conversations],
  );

  const previewConversation = conversations.find((c) => c.peerId === previewPeerId) ?? null;
  const reportConversation = conversations.find((c) => c.peerId === reportPeerId) ?? null;
  const blockConversation = conversations.find((c) => c.peerId === blockPeerId) ?? null;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
          <MessageCircle size={20} aria-hidden="true" className="text-[var(--ww-text-4)]" />
        </span>
        <p className="text-[13px] text-[var(--ww-text-3)]">{t('empty')}</p>
      </div>
    );
  }

  function handleMute(conv: Conversation) {
    trackClick('dm:toggle_mute');
    toggleMute.mutate(
      { peerId: conv.peerId, muted: !conv.isMuted },
      { onError: (err) => toast.error(parseError(err, t('mute'))) },
    );
  }

  function handlePin(conv: Conversation) {
    trackClick('dm:toggle_pin');
    togglePin.mutate(
      { peerId: conv.peerId, pinned: !conv.isPinned },
      { onError: (err) => toast.error(parseError(err, t('pinLimitReached'))) },
    );
  }

  function handleUnblock(conv: Conversation) {
    trackClick('dm:unblock');
    unblockUser.mutate(conv.peerId, {
      onError: (err) => toast.error(parseError(err, t('blockError'))),
    });
  }

  return (
    <div className="flex flex-col">
      {sorted.map((conv, idx) => {
        const active = conv.peerId === selectedPeerId;
        const color = memberColor(conv.peerId);
        const initials = (conv.peerUsername ?? '?').slice(0, 2).toUpperCase();
        const unread = conv.unreadCount > 0;

        return (
          <div key={conv.peerId} className="group relative">
            <button
              type="button"
              onClick={() => { trackClick('dm:select_conversation'); onSelect(conv.peerId); }}
              onContextMenu={(e) => { e.preventDefault(); trackClick('dm:preview_open'); setPreviewPeerId(conv.peerId); }}
              className={`flex w-full cursor-pointer items-center gap-3.5 border-l-2 py-3 pl-3.5 pr-10 text-left transition-colors ${
                active
                  ? 'border-l-[var(--ww-accent)] bg-[var(--ww-accent-soft)]'
                  : unread
                    ? 'border-l-[rgba(124,58,237,0.6)] hover:bg-[var(--ww-surface-1)]'
                    : 'border-l-transparent hover:bg-[var(--ww-surface-1)]'
              }`}
            >
              <span
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-[15px] font-semibold"
                style={{ borderColor: color, backgroundColor: `${color}22`, color }}
              >
                {conv.peerAvatar ? (
                  <img src={conv.peerAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex items-center gap-1.5">
                  {conv.isPinned && <Pin size={11} aria-hidden="true" className="shrink-0 text-[var(--ww-text-4)]" />}
                  {conv.isMuted && <BellOff size={11} aria-hidden="true" className="shrink-0 text-[var(--ww-text-4)]" />}
                  <span
                    className={`truncate text-[14.5px] ${
                      unread ? 'font-semibold text-[var(--ww-text)]' : 'font-medium text-[var(--ww-text-2)]'
                    }`}
                  >
                    {conv.peerUsername}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-[var(--ww-text-4)]">
                    {conv.lastMessageAt ? formatRelative(conv.lastMessageAt) : ''}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-[12.5px] ${
                      unread ? 'text-[var(--ww-text-2)]' : 'text-[var(--ww-text-4)]'
                    }`}
                  >
                    {conv.lastMessage ?? ''}
                  </span>
                  {unread && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--ww-accent)] px-1.5 text-[11px] font-semibold tabular-nums text-white">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </button>

            {/* Hover/tap action menu — web replacement for long-press. md:opacity-0 keeps it
                hidden until hover on desktop, but always visible below md (no hover on touch). */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); trackClick('dm:conv_menu_open'); }}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ww-text-3)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)] md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                  aria-label={t('convMenu')}
                >
                  <MoreVertical size={16} aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-[var(--ww-line)] bg-[var(--ww-panel-solid)] text-[var(--ww-text-2)]"
              >
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-[var(--ww-surface-2)] focus:text-[var(--ww-text)]"
                  onClick={() => setPreviewPeerId(conv.peerId)}
                >
                  <Eye size={15} aria-hidden="true" /> {t('preview')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-[var(--ww-surface-2)] focus:text-[var(--ww-text)]"
                  onClick={() => handlePin(conv)}
                >
                  {conv.isPinned ? <PinOff size={15} aria-hidden="true" /> : <Pin size={15} aria-hidden="true" />}
                  {conv.isPinned ? t('unpin') : t('pin')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-[var(--ww-surface-2)] focus:text-[var(--ww-text)]"
                  onClick={() => handleMute(conv)}
                >
                  {conv.isMuted ? <Bell size={15} aria-hidden="true" /> : <BellOff size={15} aria-hidden="true" />}
                  {conv.isMuted ? t('unmute') : t('mute')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--ww-line)]" />
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-[var(--ww-surface-2)] focus:text-[var(--ww-text)]"
                  onClick={() => { trackClick('dm:report_open'); setReportPeerId(conv.peerId); }}
                >
                  <Flag size={15} aria-hidden="true" /> {t('reportUser')}
                </DropdownMenuItem>
                {conv.isBlocked ? (
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-[var(--ww-surface-2)] focus:text-[var(--ww-text)]"
                    onClick={() => handleUnblock(conv)}
                  >
                    <Ban size={15} aria-hidden="true" /> {t('unblockBtn')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="cursor-pointer text-[var(--ww-danger)] focus:bg-[var(--ww-danger-soft)] focus:text-[var(--ww-danger)]"
                    onClick={() => { trackClick('dm:block_open'); setBlockPeerId(conv.peerId); }}
                  >
                    <Ban size={15} aria-hidden="true" /> {t('blockBtn')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ajratgich — avatardan keyin boshlanadi */}
            {idx < sorted.length - 1 && (
              <div aria-hidden="true" className="ml-[78px] h-px bg-[var(--ww-line)]" />
            )}
          </div>
        );
      })}

      <ChatPreviewModal
        conversation={previewConversation}
        open={!!previewPeerId}
        onOpenChange={(open) => { if (!open) setPreviewPeerId(null); }}
        onOpenFull={(peerId) => { setPreviewPeerId(null); onSelect(peerId); }}
      />

      <ReportUserDialog
        peerId={reportPeerId}
        peerUsername={reportConversation?.peerUsername}
        onOpenChange={(open) => { if (!open) setReportPeerId(null); }}
      />

      <BlockUserDialog
        peerId={blockPeerId}
        peerUsername={blockConversation?.peerUsername}
        onOpenChange={(open) => { if (!open) setBlockPeerId(null); }}
      />
    </div>
  );
}
