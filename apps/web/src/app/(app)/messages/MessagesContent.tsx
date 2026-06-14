'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useConversations, useMessages, useSendDm, useDmRealtime } from '@/hooks/use-dm';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';

export function MessagesContent() {
  const t = useTranslations('dm');
  const searchParams = useSearchParams();
  const [selectedPeer, setSelectedPeer] = useState<string | null>(
    searchParams.get('peer'),
  );

  const { data: conversations, isLoading: loadingConvos } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedPeer);
  const sendDm = useSendDm();
  useDmRealtime(selectedPeer);

  // Update from search params
  useEffect(() => {
    const peer = searchParams.get('peer');
    if (peer) setSelectedPeer(peer);
  }, [searchParams]);

  const selectedConvo = conversations?.find((c) => c.peerId === selectedPeer);
  const peerName = selectedConvo?.peer.username ?? 'Chat';

  function handleSend(text: string) {
    if (!selectedPeer) return;
    sendDm.mutate({ peerId: selectedPeer, text });
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)]">
      <h1 className="text-2xl font-bold text-white mb-4">{t('title')}</h1>

      <div className="flex h-[calc(100%-3rem)] card overflow-hidden">
        {/* Left panel: conversations */}
        <div className={`w-full md:w-72 border-r border-white/[0.06] overflow-y-auto ${selectedPeer ? 'hidden md:block' : ''}`}>
          {loadingConvos ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-violet-400" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations ?? []}
              selectedPeerId={selectedPeer}
              onSelect={setSelectedPeer}
            />
          )}
        </div>

        {/* Right panel: chat */}
        <div className={`flex-1 ${!selectedPeer ? 'hidden md:flex' : 'flex'} flex-col`}>
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
              />
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <MessageCircle size={32} className="text-slate-600" />
              <p className="text-sm text-slate-400">{t('selectChat')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
