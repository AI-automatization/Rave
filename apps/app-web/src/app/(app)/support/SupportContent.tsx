'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Headphones, Send, Star, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

const ADMIN_SOCKET_URL = process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL ?? 'http://localhost:3008';

interface SupportConversation {
  _id: string;
  status: 'open' | 'closed';
  createdAt: string;
  rating?: { score: number };
}

interface SupportMessage {
  _id: string;
  text: string;
  senderRole: 'user' | 'admin';
  createdAt: string;
}

function SupportBubble({ msg }: { msg: SupportMessage }) {
  const d = new Date(msg.createdAt);
  const time = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  const isFromUser = msg.senderRole === 'user';

  return (
    <div className={`flex items-end gap-2 ${isFromUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isFromUser && (
        <div
          className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 mb-0.5"
          style={{ backgroundColor: '#7B72F8' }}
        >
          <Headphones size={13} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-3.5 py-2.5 flex flex-col gap-0.5 ${
          isFromUser
            ? 'rounded-[18px] rounded-br-[5px] text-white'
            : 'rounded-[18px] rounded-bl-[5px] text-white/85 border border-white/[0.06]'
        }`}
        style={isFromUser ? { backgroundColor: '#7B72F8' } : { backgroundColor: '#1C1C2E' }}
      >
        <p className="text-sm break-words leading-[1.45]">{msg.text}</p>
        <p className={`text-[9px] self-end leading-none ${isFromUser ? 'text-white/50' : 'text-white/28'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

export function SupportContent() {
  const t = useTranslations('support');
  const qc = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['support-conversations'],
    queryFn: async () => {
      const res = await apiClient<SupportConversation[]>('/api/support/conversations');
      return res.data ?? [];
    },
  });

  // Auto-use active conversation (open first, else latest)
  const activeConv =
    conversations?.find((c) => c.status === 'open') ?? conversations?.[0] ?? null;

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ['support-messages', activeConv?._id],
    queryFn: async () => {
      if (!activeConv) return [];
      const res = await apiClient<SupportMessage[]>(
        `/api/support/conversations/${activeConv._id}/messages`,
      );
      return res.data ?? [];
    },
    enabled: !!activeConv,
  });

  // Socket.io — real-time messages
  const connectSocket = useCallback(async (convId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('support:join', convId);
      return;
    }

    const res = await fetch('/api/auth/token', { credentials: 'include' });
    const data = await res.json() as { data?: { token?: string } };
    const token = data.data?.token;
    if (!token) return;

    const sock = io(ADMIN_SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    sock.on('connect', () => {
      sock.emit('support:join', convId);
    });

    sock.on('support:message', (msg: SupportMessage) => {
      qc.setQueryData<SupportMessage[]>(['support-messages', convId], (prev) => {
        if (!prev) return [msg];
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    sock.on('support:closed', () => {
      void qc.invalidateQueries({ queryKey: ['support-conversations'] });
    });

    socketRef.current = sock;
  }, [qc]);

  useEffect(() => {
    if (activeConv?.status === 'open' && activeConv._id) {
      void connectSocket(activeConv._id);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [activeConv?._id, activeConv?.status, connectSocket]);

  const startConvo = useMutation({
    mutationFn: () =>
      apiClient('/api/support/conversations', {
        method: 'POST',
        body: { subject: 'Support' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-conversations'] }),
    onError: () => toast({ title: 'Error', description: 'Could not start chat', variant: 'destructive' }),
  });

  const sendMessage = useMutation({
    mutationFn: (text: string) =>
      apiClient(`/api/support/conversations/${activeConv!._id}/messages`, {
        method: 'POST',
        body: { text },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-messages', activeConv?._id] });
      setInputText('');
    },
    onError: () => toast({ title: 'Error', description: 'Could not send message', variant: 'destructive' }),
  });

  const rateConvo = useMutation({
    mutationFn: (r: number) =>
      apiClient(`/api/support/conversations/${activeConv!._id}/rate`, {
        method: 'POST',
        body: { score: r },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-conversations'] });
      toast({ title: '✓', description: t('rateThanks') });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || !activeConv) return;
    sendMessage.mutate(text);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isClosed = activeConv?.status === 'closed';
  const isLoading = convLoading || msgLoading;

  return (
    <div
      className="h-[calc(100vh-3rem)] flex flex-col rounded-xl border border-white/[0.06] overflow-hidden"
      style={{ maxWidth: '40rem', margin: '0 auto', backgroundColor: '#0D0D1A' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-11 border-b border-white/[0.06] shrink-0"
        style={{ backgroundColor: '#111113' }}
      >
        <Headphones size={15} className="text-slate-400" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">{t('title')}</p>
        </div>
        {isClosed && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-white/35 border border-white/[0.06]">
            {t('closed')}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-hide">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-violet-400" />
          </div>
        ) : !activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <Headphones size={28} className="text-slate-700" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-400">{t('emptyTitle')}</p>
              <p className="text-xs text-slate-600 mt-1">{t('emptySub')}</p>
            </div>
            <button
              onClick={() => startConvo.mutate()}
              disabled={startConvo.isPending}
              className="h-9 px-5 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 cursor-pointer disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {startConvo.isPending ? <Loader2 size={14} className="animate-spin" /> : t('startChat')}
            </button>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
            <MessageCircle size={36} className="text-white/10" />
            <p className="text-[14px] font-semibold text-white/28">{t('noMessages')}</p>
          </div>
        ) : (
          messages?.map((msg) => <SupportBubble key={msg._id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Rating (closed) */}
      {isClosed && (
        <div
          className="px-4 py-3 border-t border-white/[0.06] flex flex-col items-center gap-2"
          style={{ backgroundColor: '#111120' }}
        >
          <p className="text-xs text-white/40">{t('rateTitle')}</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => { setRating(star); rateConvo.mutate(star); }}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  size={22}
                  className={
                    star <= (hoverRating || rating || (activeConv?.rating?.score ?? 0))
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/15'
                  }
                />
              </button>
            ))}
          </div>
          <button
            onClick={() => startConvo.mutate()}
            disabled={startConvo.isPending}
            className="mt-1 h-8 px-5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 cursor-pointer disabled:opacity-40 transition-colors"
          >
            {t('newChat')}
          </button>
        </div>
      )}

      {/* Input */}
      {activeConv && !isClosed && (
        <div
          className="flex items-end gap-2 px-4 pt-2.5 pb-3 border-t border-white/[0.06]"
          style={{ backgroundColor: '#111120' }}
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('placeholder')}
            maxLength={500}
            rows={1}
            className="flex-1 rounded-[22px] px-4 py-2.5 text-sm text-white placeholder:text-white/28 focus:outline-none focus:border-violet-500/45 transition-all resize-none leading-5"
            style={{
              backgroundColor: '#1C1C2E',
              border: '1px solid rgba(255,255,255,0.07)',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 disabled:opacity-30 bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.06]"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
