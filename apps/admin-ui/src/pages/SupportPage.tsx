import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, CheckCircle, Clock, MessageCircle, Send,
  ChevronRight, AlertCircle, Shield, ShieldOff, ExternalLink, Zap,
} from 'lucide-react';
import { supportApi, SupportConversation, SupportMessage } from '../api/support.api';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import { supportSocket } from '../socket/supportSocket';
import type { AdminUser } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function avatar(userId: string, label: string) {
  const hue = userId.charCodeAt(0) * 137 % 360;
  return { bg: `hsl(${hue},40%,18%)`, fg: `hsl(${hue},70%,68%)`, label };
}

const CANNED = [
  'Здравствуйте! Чем могу помочь?',
  'Спасибо за обращение — изучаем ваш вопрос.',
  'Проблема решена! Если возникнут вопросы — пишите.',
  'Уточните, пожалуйста, какое устройство используете?',
];

// ── UserCache ─────────────────────────────────────────────────────────────────
const userCache: Record<string, AdminUser> = {};

function useUser(userId: string) {
  const [user, setUser] = useState<AdminUser | null>(userCache[userId] ?? null);
  useEffect(() => {
    if (userCache[userId]) { setUser(userCache[userId]); return; }
    usersApi.getById(userId).then(u => { userCache[userId] = u; setUser(u); }).catch(() => {});
  }, [userId]);
  return user;
}

// ── ConvRow ───────────────────────────────────────────────────────────────────
function ConvRow({ conv, active, onClick }: { conv: SupportConversation; active: boolean; onClick: () => void }) {
  const user = useUser(conv.userId);
  const av = avatar(conv.userId, (user?.username || conv.userId).slice(0, 2).toUpperCase());
  const name = user?.username || conv.userId.slice(-8);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 border-b border-white/[0.04] text-left transition-all
        ${active ? 'bg-[#7B72F8]/10 border-l-2 border-l-[#7B72F8]' : 'hover:bg-white/[0.03]'}`}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
        style={{ background: av.bg, color: av.fg }}>
        {av.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-xs font-semibold text-white truncate">{name}</span>
          <span className="text-[10px] text-white/30 shrink-0">{relativeTime(conv.lastMessageAt)}</span>
        </div>
        {user?.email && <p className="text-[10px] text-white/40 truncate mb-1">{user.email}</p>}
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium
          ${conv.status === 'open' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.05] text-white/30'}`}>
          {conv.status === 'open' ? '● Открыт' : '○ Закрыт'}
        </span>
      </div>
    </button>
  );
}

// ── UserPanel ─────────────────────────────────────────────────────────────────
function UserPanel({ userId, onBlock }: { userId: string; onBlock: () => void }) {
  const navigate = useNavigate();
  const user = useUser(userId);
  const [blocking, setBlocking] = useState(false);
  const av = avatar(userId, (user?.username || userId).slice(0, 2).toUpperCase());

  const toggleBlock = async () => {
    if (!user || blocking) return;
    setBlocking(true);
    try {
      if (user.isBlocked) await usersApi.unblock(user._id);
      else await usersApi.block(user._id, 'Blocked via support');
      userCache[userId] = { ...user, isBlocked: !user.isBlocked };
      onBlock();
    } catch { /* ignore */ }
    finally { setBlocking(false); }
  };

  return (
    <div className="w-64 shrink-0 border-l border-white/[0.06] flex flex-col bg-[#0a0a12] overflow-y-auto">
      {/* User header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: av.bg, color: av.fg }}>
            {av.label}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.username || '—'}</p>
            <p className="text-[11px] text-white/40 mt-0.5 break-all">{user?.email || userId.slice(-12)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#7B72F8]/20 text-[#7B72F8] font-medium">
              {user?.role ?? 'user'}
            </span>
            {user?.isBlocked && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                Заблокирован
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-white/[0.06] space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Аккаунт</p>
        {user?.createdAt && (
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">Зарегистрирован</span>
            <span className="text-white/70">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        )}
        <div className="flex justify-between text-[11px]">
          <span className="text-white/40">User ID</span>
          <span className="text-white/50 font-mono text-[10px]">{userId.slice(-8)}</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 py-3 border-b border-white/[0.06] space-y-1">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Быстрые ссылки</p>
        <button
          onClick={() => navigate(`/users/${userId}`)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
        >
          <span className="text-[11px] text-white/70">Профиль пользователя</span>
          <ExternalLink size={11} className="text-white/30" />
        </button>
        <button
          onClick={() => navigate(`/errors?userId=${userId}`)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
        >
          <span className="text-[11px] text-white/70">Ошибки пользователя</span>
          <ChevronRight size={11} className="text-white/30" />
        </button>
        <button
          onClick={() => navigate(`/activity?userId=${userId}`)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
        >
          <span className="text-[11px] text-white/70">Активность</span>
          <ChevronRight size={11} className="text-white/30" />
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2 mt-auto">
        <button
          onClick={toggleBlock}
          disabled={blocking || !user}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40
            ${user?.isBlocked
              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
        >
          {user?.isBlocked ? <Shield size={12} /> : <ShieldOff size={12} />}
          {user?.isBlocked ? 'Разблокировать' : 'Заблокировать'}
        </button>
      </div>
    </div>
  );
}

// ── SupportPage ───────────────────────────────────────────────────────────────
export function SupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevConvId = useRef<string | null>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // socket
  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (token) supportSocket.connect(token);
    return () => supportSocket.disconnect();
  }, []);

  useEffect(() => {
    if (prevConvId.current) supportSocket.leaveConv(prevConvId.current);
    if (selected?.id) { supportSocket.joinConv(selected.id); prevConvId.current = selected.id; }
    else prevConvId.current = null;
  }, [selected?.id]);

  useEffect(() => {
    const handler = (msg: SupportMessage) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    };
    supportSocket.onMessage(handler);
    return () => supportSocket.offMessage(handler);
  }, []);

  // conversation list
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
    const p = setInterval(() => { void loadList(); }, 15_000);
    return () => clearInterval(p);
  }, [loadList]);

  // messages
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!selected || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await supportApi.sendMessage(selected.id, text.trim());
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      setText('');
      setShowCanned(false);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const closeConv = async () => {
    if (!selected || closing) return;
    setClosing(true);
    try {
      const updated = await supportApi.close(selected.id);
      setSelected(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch { /* ignore */ }
    finally { setClosing(false); }
  };

  const selectedUser = selected ? (userCache[selected.userId] ?? null) : null;
  const senderName = (msg: SupportMessage) => {
    if (msg.senderRole === 'admin') return 'Поддержка';
    return selectedUser?.username || selected?.userId.slice(-6) || 'Пользователь';
  };

  const filtered = search
    ? conversations.filter(c => {
        const u = userCache[c.userId];
        return c.userId.includes(search) || u?.username?.toLowerCase().includes(search.toLowerCase()) || u?.email?.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  return (
    <div className="flex h-full min-h-0">

      {/* ── 1. Conversation list ───────────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#080810]">
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <MessageCircle size={13} className="text-[#7B72F8]" /> Поддержка
            </h2>
            <span className="text-[10px] bg-[#7B72F8]/20 text-[#7B72F8] px-1.5 py-0.5 rounded font-semibold">{total}</span>
          </div>
          <div className="flex gap-1 mb-2.5">
            {(['open', 'closed', 'all'] as const).map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                className={`flex-1 text-[10px] py-1 rounded-md font-medium transition-colors
                  ${status === s ? 'bg-[#7B72F8]/20 text-[#7B72F8]' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}`}>
                {s === 'open' ? 'Открытые' : s === 'closed' ? 'Закрытые' : 'Все'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени, email…"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-white/25 outline-none focus:border-[#7B72F8]/40" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-white/[0.04] animate-pulse bg-white/[0.015]" />
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-10 text-white/20 text-xs">Нет диалогов</p>
          )}
          {filtered.map(conv => (
            <ConvRow key={conv.id} conv={conv} active={selected?.id === conv.id} onClick={() => setSelected(conv)} />
          ))}
        </div>

        {total > 30 && (
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-[10px] text-white/30 hover:text-white disabled:opacity-20">← Пред</button>
            <span className="text-[10px] text-white/20">{page}</span>
            <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}
              className="text-[10px] text-white/30 hover:text-white disabled:opacity-20">След →</button>
          </div>
        )}
      </div>

      {/* ── 2. Chat panel ─────────────────────────────────────────────────────── */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
          <MessageCircle size={44} className="opacity-30" />
          <p className="text-sm">Выберите диалог</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">

          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3 shrink-0 bg-[#0c0c18]">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">
                {selectedUser?.username || selected.userId.slice(-10)}
              </p>
              <p className="text-[10px] text-white/35">
                {selectedUser?.email || selected.userId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium
                ${selected.status === 'open' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.05] text-white/30'}`}>
                {selected.status === 'open' ? '● Открыт' : '○ Закрыт'}
              </span>
              {selected.status === 'open' && (
                <button onClick={closeConv} disabled={closing}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white transition-colors disabled:opacity-30">
                  <CheckCircle size={11} /> Закрыть
                </button>
              )}
              <button onClick={() => setSelected(null)} className="text-white/25 hover:text-white transition-colors ml-1">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {msgLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-10 rounded-xl animate-pulse bg-white/[0.04] ${i % 2 ? 'self-end w-48' : 'w-64'}`} />
            ))}
            {!msgLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
                <Clock size={28} className="opacity-30" />
                <p className="text-xs">Нет сообщений</p>
              </div>
            )}
            {messages.map(m => {
              const isAdmin = m.senderRole === 'admin';
              return (
                <div key={m.id} className={`flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-white/30 px-1">{senderName(m)}</span>
                  <div className={`max-w-[65%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed
                    ${isAdmin
                      ? 'bg-[#7B72F8]/25 text-white border border-[#7B72F8]/20 rounded-tr-sm'
                      : 'bg-white/[0.07] text-white border border-white/[0.07] rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className="text-[9px] text-white/30 mt-1.5 text-right">{relativeTime(m.createdAt)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Canned responses */}
          {showCanned && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {CANNED.map(c => (
                <button key={c} onClick={() => { setText(c); setShowCanned(false); inputRef.current?.focus(); }}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-[#7B72F8]/15 text-[#7B72F8] hover:bg-[#7B72F8]/25 transition-colors border border-[#7B72F8]/20">
                  {c.length > 40 ? c.slice(0, 40) + '…' : c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {selected.status === 'open' ? (
            <div className="px-4 py-3 border-t border-white/[0.06] flex flex-col gap-2 shrink-0 bg-[#0c0c18]">
              <div className="flex gap-2">
                <button onClick={() => setShowCanned(v => !v)}
                  className={`shrink-0 p-2 rounded-lg transition-colors ${showCanned ? 'bg-[#7B72F8]/20 text-[#7B72F8]' : 'text-white/25 hover:text-white hover:bg-white/[0.05]'}`}
                  title="Быстрые ответы">
                  <Zap size={14} />
                </button>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                  placeholder="Ответить пользователю…"
                  className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#7B72F8]/40 transition-colors"
                />
                <button onClick={() => void send()} disabled={!text.trim() || sending}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#7B72F8] hover:bg-[#6B62E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-white/[0.06] text-center text-xs text-white/25 bg-[#0c0c18] flex items-center justify-center gap-2">
              <AlertCircle size={12} /> Диалог закрыт
            </div>
          )}
        </div>
      )}

      {/* ── 3. User panel ──────────────────────────────────────────────────────── */}
      {selected && (
        <UserPanel
          userId={selected.userId}
          onBlock={() => { /* force re-render */ setSelected(s => s ? { ...s } : null); }}
        />
      )}
    </div>
  );
}
