import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, CheckCheck, MessageSquare, Send, Zap,
  ExternalLink, ShieldOff, Shield, Copy, Check,
  BarChart2, AlertTriangle, LogIn, Smartphone, Clock,
  BadgeCheck, UserX,
} from 'lucide-react';
import { supportApi, SupportConversation, SupportMessage } from '../api/support.api';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import { supportSocket } from '../socket/supportSocket';
import type { AdminUser } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60)  return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}ч`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}д`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}

function initials(str: string) {
  return str.slice(0, 2).toUpperCase();
}

function StarRating({ score, size = 12 }: { score: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: size }} className={n <= score ? 'text-yellow-400' : 'text-white/15'}>
          ★
        </span>
      ))}
    </span>
  );
}

function avatarColor(id: string) {
  const colors = [
    ['#1e1340', '#a78bfa'], ['#0d1f35', '#60a5fa'], ['#0e2318', '#4ade80'],
    ['#2a1409', '#fb923c'], ['#1a0e2e', '#c084fc'], ['#0f1e1a', '#34d399'],
    ['#261018', '#f87171'], ['#1c1a07', '#facc15'],
  ];
  const [bg, fg] = colors[id.charCodeAt(0) % colors.length];
  return { bg, fg };
}

const CANNED = [
  'Здравствуйте! Чем могу вам помочь?',
  'Спасибо за обращение. Изучаем ваш вопрос — ответим в ближайшее время.',
  'Проблема решена! Если возникнут вопросы — пишите, всегда рады помочь.',
  'Уточните, пожалуйста: какое устройство и версию приложения используете?',
  'Попробуйте переустановить приложение — это решает большинство подобных проблем.',
  'Выполняем работы на нашей стороне, всё заработает в течение часа.',
];

// ─── cache ───────────────────────────────────────────────────────────────────

const userCache: Record<string, AdminUser> = {};

function useUser(userId: string | undefined) {
  const [user, setUser] = useState<AdminUser | null>(userId ? (userCache[userId] ?? null) : null);
  useEffect(() => {
    if (!userId) return;
    if (userCache[userId]) { setUser(userCache[userId]); return; }
    usersApi.getById(userId)
      .then(u => { userCache[userId] = u; setUser(u); })
      .catch(() => {});
  }, [userId]);
  return user;
}

// ─── ConvItem ────────────────────────────────────────────────────────────────

function ConvItem({
  conv, active, onClick,
}: { conv: SupportConversation; active: boolean; onClick: () => void }) {
  const user = useUser(conv.userId);
  const name = user?.username ?? `#${conv.userId.slice(-6)}`;
  const { bg, fg } = avatarColor(conv.userId);
  const isOpen = conv.status === 'open';

  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-3 text-left relative transition-all duration-150 group',
        active
          ? 'bg-accent/[0.12] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[3px] after:bg-accent after:rounded-r'
          : 'hover:bg-white/[0.03]',
      ].join(' ')}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold"
          style={{ background: bg, color: fg }}
        >
          {initials(name)}
        </div>
        <span className={[
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#07070e]',
          isOpen ? 'bg-emerald-400' : 'bg-white/20',
        ].join(' ')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          <span className={`text-[12px] font-semibold truncate ${active ? 'text-white' : 'text-white/80'}`}>
            {name}
          </span>
          <span className="text-[10px] text-white/25 shrink-0 tabular-nums">
            {relTime(conv.lastMessageAt)}
          </span>
        </div>
        <p className="text-[11px] text-white/35 truncate">
          {user?.email ?? conv.userId}
        </p>
        {conv.rating?.score && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <StarRating score={conv.rating.score} size={10} />
            <span className="text-[10px] text-yellow-400/70 font-medium">{conv.rating.score}/5</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── MsgBubble ───────────────────────────────────────────────────────────────

function MsgBubble({
  msg, isAdmin, showMeta, userName,
}: {
  msg: SupportMessage;
  isAdmin: boolean;
  showMeta: boolean;
  userName: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
      {showMeta && (
        <span className="text-[10px] text-white/25 px-1 mb-1">{userName}</span>
      )}
      <div
        className="relative group/bubble"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={[
          'max-w-[420px] px-4 py-2.5 text-[13px] leading-relaxed rounded-2xl',
          isAdmin
            ? 'bg-gradient-to-br from-accent to-[#5d55e8] text-white rounded-tr-sm shadow-lg shadow-accent/20'
            : 'bg-raised text-white/85 border border-white/[0.07] rounded-tl-sm',
        ].join(' ')}>
          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        </div>
        <span className={[
          'absolute bottom-[-18px] text-[10px] text-white/20 whitespace-nowrap transition-opacity duration-150',
          isAdmin ? 'right-1' : 'left-1',
          hovered ? 'opacity-100' : 'opacity-0',
        ].join(' ')}>
          {fullDate(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── DateSep ─────────────────────────────────────────────────────────────────

function DateSep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-white/[0.05]" />
      <span className="text-[10px] text-white/20 font-medium px-1">{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

// ─── CopyBtn ─────────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-white/20 hover:text-white/60 transition-colors ml-1">
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

// ─── UserPanel ───────────────────────────────────────────────────────────────

function UserPanel({
  userId, onBlockChange, rating,
}: { userId: string; onBlockChange: () => void; rating?: { score: number; comment?: string | null; ratedAt: string } | null }) {
  const navigate = useNavigate();
  const user = useUser(userId);
  const [blocking, setBlocking] = useState(false);
  const { bg, fg } = avatarColor(userId);
  const name = user?.username ?? `#${userId.slice(-6)}`;

  const toggleBlock = async () => {
    if (!user || blocking) return;
    setBlocking(true);
    try {
      if (user.isBlocked) await usersApi.unblock(user._id);
      else await usersApi.block(user._id, 'Blocked via support');
      userCache[userId] = { ...user, isBlocked: !user.isBlocked };
      onBlockChange();
    } catch { /* ignore */ }
    finally { setBlocking(false); }
  };

  return (
    <div className="w-[260px] shrink-0 border-l border-white/[0.05] flex flex-col bg-void overflow-y-auto">

      {/* Avatar section */}
      <div className="flex flex-col items-center px-5 pt-6 pb-5 border-b border-white/[0.05]">
        <div
          className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-lg font-bold mb-3 ring-1 ring-white/[0.08]"
          style={{ background: bg, color: fg }}
        >
          {initials(name)}
        </div>
        <p className="text-[13px] font-semibold text-white mb-0.5">{user?.username ?? '—'}</p>
        <p className="text-[11px] text-white/40 text-center break-all mb-3 leading-snug">
          {user?.email ?? userId}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium border border-accent/20">
            {user?.role ?? 'user'}
          </span>
          {user?.isEmailVerified && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/15">
              <BadgeCheck size={9} /> Подтверждён
            </span>
          )}
          {user?.isBlocked && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium border border-red-500/20">
              <UserX size={9} /> Заблокирован
            </span>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="px-4 py-4 border-b border-white/[0.05] space-y-3">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.12em] font-semibold">Аккаунт</p>

        <InfoRow icon={<Clock size={11} />} label="Зарегистрирован">
          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
        </InfoRow>

        <InfoRow icon={<LogIn size={11} />} label="Последний вход">
          {user?.lastLoginAt ? relTime(user.lastLoginAt) + ' назад' : '—'}
        </InfoRow>

        {user?.lastDevice && (
          <InfoRow icon={<Smartphone size={11} />} label="Устройство">
            <span className="truncate max-w-[110px] block" title={user.lastDevice}>
              {user.lastDevice}
            </span>
          </InfoRow>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/30">User ID</span>
          <span className="flex items-center text-[10px] text-white/40 font-mono">
            …{userId.slice(-8)}
            <CopyBtn value={userId} />
          </span>
        </div>

        {user?.isBlocked && user.blockReason && (
          <div className="mt-1 p-2.5 rounded-lg bg-red-500/[0.08] border border-red-500/15">
            <p className="text-[10px] text-red-400/70 mb-1 font-medium">Причина блокировки</p>
            <p className="text-[11px] text-red-400/90 leading-snug">{user.blockReason}</p>
          </div>
        )}
      </div>

      {/* Rating */}
      {rating?.score && (
        <div className="px-4 py-4 border-b border-white/[0.05] space-y-2">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.12em] font-semibold">Оценка поддержки</p>
          <div className="flex items-center gap-2">
            <StarRating score={rating.score} size={16} />
            <span className="text-[13px] font-bold text-yellow-400">{rating.score}</span>
            <span className="text-[11px] text-white/30">/ 5</span>
          </div>
          {rating.comment && (
            <p className="text-[11px] text-white/50 leading-snug italic">"{rating.comment}"</p>
          )}
          <p className="text-[10px] text-white/20">
            {new Date(rating.ratedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="px-4 py-4 border-b border-white/[0.05] space-y-0.5">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.12em] font-semibold mb-2.5">Навигация</p>

        <NavLink icon={<ExternalLink size={11} />} onClick={() => navigate(`/users/${userId}`)}>
          Профиль пользователя
        </NavLink>
        <NavLink icon={<AlertTriangle size={11} />} onClick={() => navigate(`/errors?userId=${userId}`)}>
          Ошибки
        </NavLink>
        <NavLink icon={<BarChart2 size={11} />} onClick={() => navigate(`/activity?userId=${userId}`)}>
          Активность
        </NavLink>
      </div>

      {/* Block */}
      <div className="px-4 py-4 mt-auto">
        <button
          onClick={() => void toggleBlock()}
          disabled={blocking || !user}
          className={[
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-150 disabled:opacity-30',
            user?.isBlocked
              ? 'bg-emerald-500/[0.12] text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              : 'bg-red-500/[0.08] text-red-400 hover:bg-red-500/15 border border-red-500/15',
          ].join(' ')}
        >
          {user?.isBlocked ? <Shield size={12} /> : <ShieldOff size={12} />}
          {user?.isBlocked ? 'Разблокировать' : 'Заблокировать'}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[11px] text-white/30 shrink-0">
        <span className="text-white/20">{icon}</span>{label}
      </span>
      <span className="text-[11px] text-white/60 text-right">{children}</span>
    </div>
  );
}

function NavLink({ icon, onClick, children }: {
  icon: React.ReactNode; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
    >
      <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors">{children}</span>
      <span className="text-white/20 group-hover:text-white/50 transition-colors">{icon}</span>
    </button>
  );
}

// ─── SupportPage ─────────────────────────────────────────────────────────────

export function SupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState<'open' | 'closed' | 'all'>('open');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected]     = useState<SupportConversation | null>(null);
  const [messages, setMessages]     = useState<SupportMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCanned, setShowCanned] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevConvId  = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  const selectedUser = selected ? (userCache[selected.userId] ?? null) : null;

  // ── socket ────────────────────────────────────────────────────────────────

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

  // ── list ──────────────────────────────────────────────────────────────────

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
    const p = setInterval(() => { void loadList(); }, 20_000);
    return () => clearInterval(p);
  }, [loadList]);

  // ── messages ──────────────────────────────────────────────────────────────

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

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  // ── keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && selected) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // ── actions ───────────────────────────────────────────────────────────────

  const send = async () => {
    if (!selected || !text.trim() || sending) return;
    setSending(true);
    const draft = text.trim();
    setText('');
    setShowCanned(false);
    try {
      const msg = await supportApi.sendMessage(selected.id, draft);
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch {
      setText(draft);
    } finally {
      setSending(false);
    }
  };

  const sendAndClose = async () => {
    if (!selected || closing) return;
    if (text.trim()) await send();
    setClosing(true);
    try {
      const updated = await supportApi.close(selected.id);
      setSelected(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch { /* ignore */ }
    finally { setClosing(false); }
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

  // ── derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => {
      const u = userCache[c.userId];
      return c.userId.includes(q)
        || u?.username?.toLowerCase().includes(q)
        || u?.email?.toLowerCase().includes(q);
    });
  }, [search, conversations]);

  // message grouping + date separators
  const messageRows = useMemo(() => {
    type Row = { type: 'date'; label: string } | { type: 'msg'; msg: SupportMessage; showMeta: boolean };
    const rows: Row[] = [];
    let lastDay = '';
    let lastSender = '';
    let lastTime = 0;

    for (const msg of messages) {
      const day = dayLabel(msg.createdAt);
      if (day !== lastDay) { rows.push({ type: 'date', label: day }); lastDay = day; lastSender = ''; }
      const gap = new Date(msg.createdAt).getTime() - lastTime > 5 * 60_000;
      const showMeta = msg.senderId !== lastSender || gap;
      rows.push({ type: 'msg', msg, showMeta });
      lastSender = msg.senderId;
      lastTime = new Date(msg.createdAt).getTime();
    }
    return rows;
  }, [messages]);

  const senderName = (msg: SupportMessage) =>
    msg.senderRole === 'admin'
      ? 'Поддержка'
      : selectedUser?.username ?? selected?.userId.slice(-6) ?? 'Пользователь';

  const openCount = conversations.filter(c => c.status === 'open').length;

  return (
    <div className="flex h-full min-h-0 bg-void">

      {/* ═══════════════════════════════ SIDEBAR ════════════════════════════ */}
      <div className="w-[260px] shrink-0 border-r border-white/[0.05] flex flex-col">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <MessageSquare size={13} className="text-accent" />
              </div>
              <span className="text-[13px] font-semibold text-white">Поддержка</span>
            </div>
            {openCount > 0 && (
              <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center animate-pulse">
                {openCount}
              </span>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 p-0.5 bg-white/[0.04] rounded-lg mb-3">
            {(['open', 'closed', 'all'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={[
                  'flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all duration-150',
                  status === s
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/30 hover:text-white/60',
                ].join(' ')}
              >
                {s === 'open' ? 'Открытые' : s === 'closed' ? 'Закрытые' : 'Все'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск… (⌘K)"
              className="w-full bg-white/[0.04] border border-white/[0.05] rounded-lg pl-8 pr-3 py-2 text-[11px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-white/[0.04] rounded animate-pulse w-2/3" />
                    <div className="h-2 bg-white/[0.03] rounded animate-pulse w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <MessageSquare size={24} className="text-white/[0.08]" />
              <p className="text-[11px] text-white/15">Нет диалогов</p>
            </div>
          )}

          {!loading && filtered.map(conv => (
            <ConvItem
              key={conv.id}
              conv={conv}
              active={selected?.id === conv.id}
              onClick={() => setSelected(conv)}
            />
          ))}
        </div>

        {/* Pagination */}
        {total > 30 && (
          <div className="px-3 py-2.5 border-t border-white/[0.05] flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-[11px] text-white/25 hover:text-white/70 disabled:opacity-20 transition-colors"
            >
              ← Пред
            </button>
            <span className="text-[10px] text-white/20">{page} / {Math.ceil(total / 30)}</span>
            <button
              disabled={page * 30 >= total}
              onClick={() => setPage(p => p + 1)}
              className="text-[11px] text-white/25 hover:text-white/70 disabled:opacity-20 transition-colors"
            >
              След →
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════ CHAT ═══════════════════════════════ */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <MessageSquare size={28} className="text-white/[0.12]" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[13px] text-white/25 font-medium">Выберите диалог</p>
            <p className="text-[11px] text-white/12">⌘K для поиска, Esc для закрытия</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">

          {/* Chat header */}
          <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center gap-3 shrink-0">
            {(() => {
              const { bg, fg } = avatarColor(selected.userId);
              const name = selectedUser?.username ?? `#${selected.userId.slice(-6)}`;
              return (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: bg, color: fg }}>
                  {initials(name)}
                </div>
              );
            })()}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-white truncate">
                  {selectedUser?.username ?? `#${selected.userId.slice(-6)}`}
                </p>
                <span className={[
                  'text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide',
                  selected.status === 'open'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-white/[0.06] text-white/25',
                ].join(' ')}>
                  {selected.status === 'open' ? 'открыт' : 'закрыт'}
                </span>
                {selected.rating?.score && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20">
                    <StarRating score={selected.rating.score} size={11} />
                    <span className="text-[10px] text-yellow-400 font-medium">{selected.rating.score}/5</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-white/30 truncate">
                {selectedUser?.email ?? selected.userId}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selected.status === 'open' && (
                <button
                  onClick={() => void closeConv()}
                  disabled={closing}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:bg-white/[0.09] hover:text-white/80 transition-all disabled:opacity-30 border border-white/[0.05]"
                >
                  <CheckCheck size={12} /> Закрыть
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                title="Закрыть (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
            {msgLoading && (
              <div className="space-y-6">
                {[false, true, false, true].map((right, i) => (
                  <div key={i} className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
                    <div className={`h-10 rounded-2xl animate-pulse bg-white/[0.04] ${right ? 'w-52' : 'w-64'}`} />
                  </div>
                ))}
              </div>
            )}

            {!msgLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                <MessageSquare size={32} className="opacity-40" />
                <p className="text-[12px]">Сообщений пока нет</p>
              </div>
            )}

            {!msgLoading && (
              <div className="flex flex-col gap-2.5">
                {messageRows.map((row, i) => {
                  if (row.type === 'date') return <DateSep key={`d-${i}`} label={row.label} />;
                  const { msg, showMeta } = row;
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div key={msg.id} className={showMeta ? 'mt-3 first:mt-0' : ''}>
                      <MsgBubble
                        msg={msg}
                        isAdmin={isAdmin}
                        showMeta={showMeta}
                        userName={senderName(msg)}
                      />
                    </div>
                  );
                })}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Canned responses */}
          {showCanned && (
            <div className="px-5 pb-2 flex flex-wrap gap-1.5 shrink-0 border-t border-white/[0.04] pt-2.5">
              {CANNED.map(c => (
                <button
                  key={c}
                  onClick={() => { setText(c); setShowCanned(false); textareaRef.current?.focus(); }}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-accent/10 text-accent/80 hover:bg-accent/20 hover:text-accent transition-all border border-accent/15"
                >
                  {c.length > 50 ? c.slice(0, 50) + '…' : c}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          {selected.status === 'open' ? (
            <div className="px-4 py-3 border-t border-white/[0.05] shrink-0">
              <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-3 py-2.5 focus-within:border-accent/40 transition-colors">
                <button
                  onClick={() => setShowCanned(v => !v)}
                  className={[
                    'shrink-0 p-1.5 rounded-lg transition-all mb-0.5',
                    showCanned
                      ? 'bg-accent/20 text-accent'
                      : 'text-white/20 hover:text-white/60 hover:bg-white/[0.06]',
                  ].join(' ')}
                  title="Быстрые ответы (⚡)"
                >
                  <Zap size={14} />
                </button>

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
                  }}
                  placeholder="Ответить… (Enter — отправить, Shift+Enter — новая строка)"
                  rows={1}
                  style={{ resize: 'none', minHeight: '24px', maxHeight: '120px' }}
                  className="flex-1 bg-transparent text-[12px] text-white placeholder-white/20 outline-none leading-relaxed py-0.5"
                />

                <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                  {selected.status === 'open' && text.trim() && (
                    <button
                      onClick={() => void sendAndClose()}
                      disabled={closing}
                      title="Отправить и закрыть"
                      className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => void send()}
                    disabled={!text.trim() || sending}
                    className="w-8 h-8 rounded-xl bg-accent hover:bg-accent-dim disabled:opacity-25 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-accent/20"
                  >
                    <Send size={13} className="text-white" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-white/12 text-right mt-1.5 pr-1">
                Enter — отправить · Shift+Enter — новая строка
              </p>
            </div>
          ) : (
            <div className="px-4 py-4 border-t border-white/[0.05] flex items-center justify-center gap-2 text-[11px] text-white/20">
              <CheckCheck size={13} className="text-white/15" />
              Диалог закрыт
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════ USER PANEL ════════════════════════ */}
      {selected && (
        <UserPanel
          userId={selected.userId}
          onBlockChange={() => setSelected(s => s ? { ...s } : null)}
          rating={selected.rating}
        />
      )}
    </div>
  );
}
