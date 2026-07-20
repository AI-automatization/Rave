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
  const peerName = selectedConvo?.peerUsername ?? 'Chat';

  function handleSend(text: string, replyTo?: ReplyTarget) {
    if (!selectedPeer || !currentUser?._id) return;
    sendDm.mutate({ peerId: selectedPeer, text, myId: currentUser._id, ...replyTo });
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col" style={{ maxWidth: '56rem', margin: '0 auto' }}>
      {/* Title — hide on mobile when chat is open */}
      <h1 className={`text-xl font-bold text-white mb-3 ${selectedPeer ? 'hidden md:block' : ''}`}>
        {t('title')}
      </h1>

      <div className="flex flex-1 overflow-hidden liquid-glass">
        {/* Left panel: conversations */}
        <div
          className={`w-full md:w-72 border-r border-white/[0.07] overflow-y-auto flex-shrink-0 ${selectedPeer ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}
          style={{ background: 'rgba(10,7,20,0.4)' }}
        >
          {/* List header */}
          <div className="px-4 py-3 border-b border-white/[0.06] hidden md:flex items-center">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{t('title')}</span>
          </div>

          {loadingConvos ? (
            <div className="flex flex-col divide-y divide-white/[0.05]" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="skeleton h-3 w-2/5 rounded" />
                    <div className="skeleton h-2.5 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fade-slide-in">
              <ConversationList
                conversations={conversations ?? []}
                selectedPeerId={selectedPeer}
                onSelect={setSelectedPeer}
              />
            </div>
          )}
        </div>

        {/* Right panel: chat */}
        <div className={`flex-1 ${!selectedPeer ? 'hidden md:flex' : 'flex'} flex-col overflow-hidden`}>
          {selectedPeer ? (
            loadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-violet-400" />
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
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <MessageCircle size={36} className="text-violet-500/20" />
              <p className="text-sm text-zinc-600">{t('selectChat')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
