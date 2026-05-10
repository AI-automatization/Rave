import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, X, CheckCircle, Clock, MessageCircle, Send, User } from 'lucide-react';
import { supportApi, SupportConversation, SupportMessage } from '../api/support.api';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import { supportSocket } from '../socket/supportSocket';
import type { AdminUser } from '../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function UserAvatar({ userId }: { userId: string }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  useEffect(() => { usersApi.getById(userId).then(setUser).catch(() => {}); }, [userId]);
  const label = user ? (user.username || user.email).slice(0, 2).toUpperCase() : userId.slice(-2).toUpperCase();
  const hue = userId.charCodeAt(0) * 137 % 360;
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: `hsl(${hue},40%,20%)`, color: `hsl(${hue},70%,70%)` }}
      title={user?.email ?? userId}
    >
      {label}
    </div>
  );
}

function ConvRow({ conv, active, onClick }: { conv: SupportConversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-3 border-b border-white/[0.04] text-left transition-colors
        ${active ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-white/[0.03]'}`}
    >
      <UserAvatar userId={conv.userId} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium text-white truncate">{conv.userId.slice(-10)}</span>
          <span className="text-[10px] text-text-dim shrink-0">{relativeTime(conv.lastMessageAt)}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium mt-0.5 inline-block
          ${conv.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.05] text-text-dim'}`}>
          {conv.status === 'open' ? 'Открыт' : 'Закрыт'}
        </span>
      </div>
    </button>
  );
}

export function SupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('open');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevConvId            = useRef<string | null>(null);

  // ── Socket: connect on mount, disconnect on unmount ──────────────────────
  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (token) supportSocket.connect(token);
    return () => supportSocket.disconnect();
  }, []);

  // ── Socket: join/leave conversation room when selected changes ────────────
  useEffect(() => {
    if (prevConvId.current) supportSocket.leaveConv(prevConvId.current);
    if (selected?.id) {
      supportSocket.joinConv(selected.id);
      prevConvId.current = selected.id;
    } else {
      prevConvId.current = null;
    }
  }, [selected?.id]);

  // ── Socket: listen for new messages ──────────────────────────────────────
  useEffect(() => {
    const handler = (msg: SupportMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    supportSocket.onMessage(handler);
    return () => supportSocket.offMessage(handler);
  }, []);

  // ── Conversation list: load + poll every 15s ──────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportApi.list({ status, page, limit: 30 });
      setConversations(res.data);
      setTotal(res.meta?.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => {
    loadList();
    const listPoll = setInterval(() => { void loadList(); }, 15_000);
    return () => clearInterval(listPoll);
  }, [loadList]);

  // ── Messages: load initial + poll every 30s as socket fallback ────────────
  const loadMessages = useCallback(async (conv: SupportConversation) => {
    setMsgLoading(true);
    try {
      const res = await supportApi.getMessages(conv.id);
      setMessages(res.data);
    } catch { /* ignore */ }
    finally { setMsgLoading(false); }
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected);
    pollRef.current = setInterval(() => loadMessages(selected), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!selected || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await supportApi.sendMessage(selected.id, text.trim());
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setText('');
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const closeConv = async () => {
    if (!selected || closing) return;
    setClosing(true);
    try {
      const updated = await supportApi.close(selected.id);
      setSelected(updated);
      setConversations((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch { /* ignore */ }
    finally { setClosing(false); }
  };

  const filtered = search
    ? conversations.filter((c) => c.userId.includes(search))
    : conversations;

  return (
    <div className="flex h-full min-h-0">

      {/* ── Left panel: conversation list ── */}
      <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0a0a12]">
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <MessageCircle size={15} className="text-purple-400" />
            Поддержка
            <span className="ml-auto text-[10px] bg-white/[0.06] text-text-dim px-1.5 py-0.5 rounded-md">{total}</span>
          </h2>

          <div className="flex gap-1 mb-2">
            {(['open', 'closed', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`flex-1 text-[10px] py-1 rounded-lg transition-colors font-medium
                  ${status === s ? 'bg-accent/20 text-accent' : 'text-text-dim hover:text-white hover:bg-white/[0.05]'}`}
              >
                {s === 'open' ? 'Открытые' : s === 'closed' ? 'Закрытые' : 'Все'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по userId…"
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-text-dim outline-none focus:border-accent/30 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-white/[0.04] animate-pulse bg-white/[0.02]" />
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-12 text-text-dim text-xs">Нет диалогов</p>
          )}
          {filtered.map((conv) => (
            <ConvRow
              key={conv.id}
              conv={conv}
              active={selected?.id === conv.id}
              onClick={() => setSelected(conv)}
            />
          ))}
        </div>

        {total > 30 && (
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-[10px] text-text-dim hover:text-white disabled:opacity-30"
            >← Пред</button>
            <span className="text-[10px] text-text-dim">{page}</span>
            <button
              disabled={page * 30 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-[10px] text-text-dim hover:text-white disabled:opacity-30"
            >След →</button>
          </div>
        )}
      </div>

      {/* ── Right panel: chat ── */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-dim gap-3">
          <MessageCircle size={40} className="opacity-20" />
          <p className="text-sm">Выберите диалог</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">

          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3 shrink-0 bg-[#0d0d16]">
            <UserAvatar userId={selected.userId} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                <User size={11} className="inline mr-1 text-text-dim" />
                {selected.userId}
              </p>
              <p className="text-[10px] text-text-dim">Последнее: {relativeTime(selected.lastMessageAt)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium
                ${selected.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.06] text-text-dim'}`}>
                {selected.status === 'open' ? 'Открыт' : 'Закрыт'}
              </span>
              {selected.status === 'open' && (
                <button
                  onClick={closeConv}
                  disabled={closing}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-text-muted hover:bg-white/[0.1] hover:text-white transition-colors disabled:opacity-40"
                >
                  <CheckCircle size={11} /> Закрыть
                </button>
              )}
              <button onClick={() => setSelected(null)} className="text-text-dim hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-2">
            {msgLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-8 rounded-xl animate-pulse bg-white/[0.04] ${i % 2 ? 'self-end w-40' : 'w-56'}`} />
            ))}
            {!msgLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-text-dim">
                <Clock size={24} className="opacity-20" />
                <p className="text-xs">Нет сообщений</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-xs leading-relaxed
                  ${m.senderRole === 'admin'
                    ? 'bg-accent/20 text-white border border-accent/20'
                    : 'bg-white/[0.07] text-white border border-white/[0.08]'
                  }`}>
                  <p>{m.text}</p>
                  <p className="text-[9px] text-white/40 mt-1 text-right">{relativeTime(m.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {selected.status === 'open' && (
            <div className="px-4 py-3 border-t border-white/[0.06] flex gap-2 shrink-0 bg-[#0d0d16]">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder="Ответить пользователю…"
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-text-dim outline-none focus:border-accent/30 transition-colors"
              />
              <button
                onClick={() => void send()}
                disabled={!text.trim() || sending}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          )}
          {selected.status === 'closed' && (
            <div className="px-4 py-3 border-t border-white/[0.06] text-center text-xs text-text-dim bg-[#0d0d16]">
              Диалог закрыт
            </div>
          )}
        </div>
      )}
    </div>
  );
}
