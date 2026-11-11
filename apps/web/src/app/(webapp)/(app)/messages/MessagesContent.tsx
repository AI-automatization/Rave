'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useConversations, useMessages, useSendDm, useDmRealtime } from '@/hooks/use-dm';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow, type ReplyTarget } from '@/components/messages/ChatWindow';
import { useAuthStore } from '@/store/auth.store';

export function MessagesContent() {
  const t = useTranslations('dm');
  const searchParams = useSearchParams();
  const [selectedPeer, setSelectedPeer] = useState<string | null>(
    searchParams.get('peer'),
  );
  const currentUser = useAuthStore((s) => s.user);

  const { data: conversations, isLoading: loadingConvos } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedPeer);
  const sendDm = useSendDm();
  // TODO(T-S122 Фаза 6): make list-level DM_MESSAGE realtime always-on (not gated on
  // selectedPeer) — currently the conversation list only refreshes live while a chat is open.
  useDmRealtime(selectedPeer, currentUser?._id);

  // Update from search params
  useEffect(() => {
    const peer = searchParams.get('peer');
    if (peer) setSelectedPeer(peer);
  }, [searchParams]);

  const selectedConvo = conversations?.find((c) => c.peerId === selectedPeer);
  const peerName = selectedConvo?.peerUsername ?? t('title');

  function handleSend(text: string, replyTo?: ReplyTarget) {
    if (!selectedPeer || !currentUser?._id) return;
    sendDm.mutate({ peerId: selectedPeer, text, myId: currentUser._id, ...replyTo });
  }

  return (
    // `dvh` — mobil brauzerda `vh` eng baland mumkin bo'lgan viewport, ya'ni
    // yozish maydoni URL paneli ostiga tushib qolardi (/support bilan bir xil).
    <div className="mx-auto flex h-[calc(100dvh-6.5rem)] max-w-4xl flex-col sm:h-[calc(100dvh-3rem)]">
      {/* Mobilda suhbat ochilganda sarlavha yashiriladi — ekran chatga beriladi */}
      <h1
        className={`mb-4 text-[26px] font-semibold tracking-[-0.025em] text-[var(--ww-text)] sm:text-[30px] ${
          selectedPeer ? 'hidden md:block' : ''
        }`}
      >
        {t('title')}
      </h1>

      <div className="ww-panel flex flex-1 overflow-hidden">
        {/* Chap ustun: suhbatlar */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-r border-[var(--ww-line)] md:w-72 ${
            selectedPeer ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          }`}
        >
          <div className="hidden items-center border-b border-[var(--ww-line)] px-4 py-3 md:flex">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ww-text-3)]">
              {t('title')}
            </span>
          </div>

          {loadingConvos ? (
            <div aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 border-b border-[var(--ww-line)] px-3.5 py-3 last:border-0"
                >
                  <div className="skeleton h-[50px] w-[50px] shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="skeleton h-3 w-2/5 rounded" />
                    <div className="skeleton h-2.5 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ww-rise">
              <ConversationList
                conversations={conversations ?? []}
                selectedPeerId={selectedPeer}
                onSelect={setSelectedPeer}
              />
            </div>
          )}
        </div>

        {/* O'ng ustun: chat */}
        <div className={`flex-1 flex-col overflow-hidden ${!selectedPeer ? 'hidden md:flex' : 'flex'}`}>
          {selectedPeer ? (
            loadingMessages ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 size={22} aria-hidden="true" className="animate-spin text-[var(--ww-accent-hi)]" />
              </div>
            ) : (
              <ChatWindow
                messages={messages ?? []}
                onSend={handleSend}
                peerName={peerName}
                peerId={selectedPeer}
                onBack={() => setSelectedPeer(null)}
              />
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
                <MessageCircle size={20} aria-hidden="true" className="text-[var(--ww-text-4)]" />
              </span>
              <p className="text-[13px] text-[var(--ww-text-3)]">{t('selectChat')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
