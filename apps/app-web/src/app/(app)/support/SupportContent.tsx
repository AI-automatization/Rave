'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Headphones, Send, Star, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { trackClick } from '@/lib/analytics';

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
        <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ww-accent)]">
          <Headphones size={13} aria-hidden="true" className="text-white" />
        </span>
      )}
      {/* Foydalanuvchi pufakchasi — aksent, operator pufakchasi — sirt.
          Ilgari ikkalasi ham qo'lda yozilgan hex (#7B72F8 / #1C1C2E) edi. */}
      <div
        className={`flex max-w-[78%] flex-col gap-0.5 rounded-[18px] px-3.5 py-2.5 ${
          isFromUser
            ? 'rounded-br-[5px] bg-[var(--ww-accent)] text-white'
            : 'rounded-bl-[5px] border border-[var(--ww-line)] bg-[var(--ww-surface-2)] text-[var(--ww-text-2)]'
        }`}
      >
        <p className="break-words text-[13.5px] leading-[1.45]">{msg.text}</p>
        <time
          dateTime={msg.createdAt}
          className={`self-end text-[10px] leading-none ${
            isFromUser ? 'text-white/60' : 'text-[var(--ww-text-4)]'
          }`}
        >
          {time}
        </time>
      </div>
    </div>
  );
}

/** Bo'sh / xato holatlari bir xil shaklda — faqat matn va ikonka farq qiladi */
function CenteredState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Headphones;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
        <Icon size={20} aria-hidden="true" className="text-[var(--ww-text-4)]" />
      </span>
      <p className="text-[14px] font-semibold text-[var(--ww-text-2)]">{title}</p>
      {hint && <p className="max-w-xs text-[12.5px] leading-relaxed text-[var(--ww-text-4)]">{hint}</p>}
      {children}
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

  const { data: conversations, isLoading: convLoading, isError: convError } = useQuery({
    queryKey: ['support-conversations'],
    queryFn: async () => {
      const res = await apiClient<SupportConversation[]>('/api/support/conversations');
      return res.data ?? [];
    },
    // Was 403ing for ordinary users — the proxy route called a URL that doesn't match any
    // backend route, and the mismatch fell through to the moderation router's global role
    // check. Fixed in api/support/conversations/route.ts (2026-08-29).
    retry: false,
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
    onError: () => toast({ title: t('startError'), variant: 'destructive' }),
  });

  // POST succeeds (201) while GET 403s, so the refetch came back empty and the same "start chat"
  // button was offered again — every click wrote another empty conversation to the database that
  // the user could never see (prod audit 2026-08-01). One attempt is all we allow: if the list is
  // still empty afterwards, something is wrong on the server and clicking again cannot fix it.
  const startFailedSilently =
    startConvo.isSuccess && !convLoading && (conversations?.length ?? 0) === 0;
  const unavailable = convError || startFailedSilently;

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
    onError: () => toast({ title: t('sendError'), variant: 'destructive' }),
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
    trackClick('support:send_message');
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
  const currentScore = hoverRating || rating || (activeConv?.rating?.score ?? 0);

  return (
    // `dvh`, not `vh`: on mobile browsers `vh` is the tallest-possible viewport, so the composer
    // sat under the URL bar. `6.5rem` clears the layout's own `pb-24` plus the floating dock.
    <div className="ww-panel mx-auto flex h-[calc(100dvh-6.5rem)] max-w-2xl flex-col overflow-hidden sm:h-[calc(100dvh-3rem)]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--ww-line)] px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ww-accent-soft)]">
          <Headphones size={14} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
        </span>
        <h1 className="flex-1 text-[14px] font-semibold text-[var(--ww-text)]">{t('title')}</h1>
        {isClosed && (
          <span className="rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--ww-text-3)]">
            {t('closed')}
          </span>
        )}
      </header>

      <div className="scrollbar-hide flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 size={22} aria-hidden="true" className="animate-spin text-[var(--ww-accent-hi)]" />
          </div>
        ) : unavailable ? (
          <CenteredState icon={Headphones} title={t('unavailableTitle')} hint={t('unavailableHint')} />
        ) : !activeConv ? (
          <CenteredState icon={Headphones} title={t('emptyTitle')} hint={t('emptySub')}>
            <Button
              type="button"
              variant="accent"
              size="xl"
              onClick={() => { trackClick('support:start_chat'); startConvo.mutate(); }}
              disabled={startConvo.isPending || startConvo.isSuccess}
              className="mt-1 px-6"
            >
              {startConvo.isPending
                ? <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                : t('startChat')}
            </Button>
          </CenteredState>
        ) : messages?.length === 0 ? (
          <CenteredState icon={MessageCircle} title={t('noMessages')} />
        ) : (
          messages?.map((msg) => <SupportBubble key={msg._id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Baholash (suhbat yopilgan) */}
      {isClosed && (
        <div className="flex shrink-0 flex-col items-center gap-2.5 border-t border-[var(--ww-line)] px-4 py-3">
          <p className="text-[12.5px] text-[var(--ww-text-3)]">{t('rateTitle')}</p>
          <div className="flex gap-1.5" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={t('rateStar', { count: star })}
                aria-pressed={star <= (rating || (activeConv?.rating?.score ?? 0))}
                onMouseEnter={() => setHoverRating(star)}
                onFocus={() => setHoverRating(star)}
                onBlur={() => setHoverRating(0)}
                onClick={() => { trackClick('support:rate', { star }); setRating(star); rateConvo.mutate(star); }}
                className="cursor-pointer p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={22}
                  aria-hidden="true"
                  className={star <= currentScore ? 'text-[var(--ww-gold)]' : 'text-[var(--ww-text-4)]'}
                  fill={star <= currentScore ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="subtle"
            size="default"
            onClick={() => { trackClick('support:new_chat'); startConvo.mutate(); }}
            disabled={startConvo.isPending || unavailable}
            className="mt-1 px-5 text-[13px] text-[var(--ww-text-2)]"
          >
            {t('newChat')}
          </Button>
        </div>
      )}

      {/* Yozish maydoni */}
      {activeConv && !isClosed && (
        <div className="flex shrink-0 items-end gap-2 border-t border-[var(--ww-line)] px-4 pb-3 pt-2.5">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            maxLength={500}
            rows={1}
            className="ww-field ww-composer min-w-0 flex-1 text-[13.5px]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
            aria-label={t('send')}
            className="ww-btn-accent flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-md)] text-white disabled:cursor-default"
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
