import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Tv2, Play, Pause, SkipForward, UserMinus, XCircle, ShieldOff,
  Link as LinkIcon, RefreshCw, Users, Clock, AlertTriangle,
  Radio, Send, MessageSquare, X, ChevronRight, Lock, Globe,
  Ban,
} from 'lucide-react';
import { watchPartiesApi } from '../api/watchparties.api';
import { useAuthStore } from '../store/auth.store';
import { watchPartySocket, RoomMessage } from '../socket/watchPartySocket';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminWatchParty, PaginationMeta } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(sec: number): string {
  if (!sec || sec <= 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  return `${Math.floor(h / 24)} дн. назад`;
}

function progressPct(current: number, duration?: number): number {
  if (!duration || duration <= 0) return 0;
  return Math.min(100, (current / duration) * 100);
}

const PLATFORM_COLOR: Record<string, string> = {
  youtube: 'text-red-400',
  direct: 'text-blue-400',
  webview: 'text-violet-400',
};

const PLATFORM_BG: Record<string, string> = {
  youtube: 'bg-red-500/10 text-red-400',
  direct: 'bg-blue-500/10 text-blue-400',
  webview: 'bg-violet-500/10 text-violet-400',
};

function StatusDot({ status }: { status: AdminWatchParty['status'] }) {
  const cfg = {
    playing: { color: 'bg-emerald-400', pulse: true, label: 'Идёт' },
    waiting: { color: 'bg-amber-400', pulse: false, label: 'Ожидает' },
    paused:  { color: 'bg-zinc-400', pulse: false, label: 'Пауза' },
    ended:   { color: 'bg-zinc-600', pulse: false, label: 'Завершён' },
  }[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`relative flex h-2 w-2`}>
        {cfg.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.color} opacity-60`} />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.color}`} />
      </span>
      <span className="text-xs text-text-muted">{cfg.label}</span>
    </span>
  );
}

// ── Room Card ─────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  isSelected,
  isSuperAdmin,
  onSelect,
  onBlock,
  onClose,
}: {
  room: AdminWatchParty;
  isSelected: boolean;
  isSuperAdmin: boolean;
  onSelect: () => void;
  onBlock: () => void;
  onClose: () => void;
}) {
  const pct = progressPct(room.currentTime, room.videoDuration);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-accent/50 bg-accent/5 shadow-[0_0_0_1px_rgba(123,114,248,0.3)]'
          : room.isSuspicious
          ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
          : room.isAdminBlocked
          ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
          : 'border-white/[0.06] bg-[#0d0d14] hover:border-white/[0.12]'
      }`}
    >
      {/* Thumbnail / banner */}
      <div className="relative h-28 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
        {room.videoThumbnail ? (
          <img src={room.videoThumbnail} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tv2 size={32} className="text-white/10" />
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-2 left-2">
          <StatusDot status={room.status} />
        </div>

        {/* Badges top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {room.isPrivate && (
            <span className="flex items-center gap-1 bg-black/60 text-white/70 text-[10px] px-1.5 py-0.5 rounded-full">
              <Lock size={9} /> Приват
            </span>
          )}
          {room.videoPlatform && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-black/60 ${PLATFORM_COLOR[room.videoPlatform] ?? 'text-text-muted'}`}>
              {room.videoPlatform}
            </span>
          )}
        </div>

        {/* Playing progress bar */}
        {room.status !== 'ended' && room.videoDuration && room.videoDuration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-accent transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Suspicious / blocked overlay */}
        {room.isSuspicious && (
          <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
            <span className="bg-red-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle size={10} /> ПОДОЗР.
            </span>
          </div>
        )}
        {room.isAdminBlocked && (
          <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
            <span className="bg-amber-500/80 text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Ban size={10} /> ЗАБЛОКИРОВАНА
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        {/* Title */}
        <div>
          <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
            {room.name ?? room.inviteCode}
          </p>
          {room.videoTitle && (
            <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{room.videoTitle}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-text-dim">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {room.members.length}/{room.maxMembers}
          </span>
          {room.currentTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTime(room.currentTime)}
              {room.videoDuration ? ` / ${formatTime(room.videoDuration)}` : ''}
            </span>
          )}
        </div>

        {/* Domain */}
        {room.domain && (
          <Link
            to="/domains"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-accent/70 hover:text-accent transition-colors w-fit"
          >
            <Globe size={10} />
            {room.domain}
          </Link>
        )}

        {/* Suspicious reason */}
        {room.isSuspicious && room.suspiciousReason && (
          <p className="text-[11px] text-red-400/80 line-clamp-1 italic">{room.suspiciousReason}</p>
        )}

        {/* Footer: actions + time */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] mt-auto">
          <span className="text-[11px] text-text-dim">{relativeTime(room.createdAt)}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isSuperAdmin && room.status !== 'ended' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onBlock(); }}
                  title="Заблокировать"
                  className="w-6 h-6 flex items-center justify-center rounded-md text-text-dim hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                >
                  <ShieldOff size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  title="Закрыть"
                  className="w-6 h-6 flex items-center justify-center rounded-md text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <XCircle size={12} />
                </button>
              </>
            )}
            <span className="w-6 h-6 flex items-center justify-center rounded-md text-accent">
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Monitor Panel ─────────────────────────────────────────────────────────────

function MonitorPanel({
  room: initialRoom,
  token,
  onClose,
  onKick,
  onBlockRoom,
  onCloseRoom,
  isSuperAdmin,
}: {
  room: AdminWatchParty;
  token: string;
  onClose: () => void;
  onKick: (userId: string) => Promise<void>;
  onBlockRoom: (room: AdminWatchParty) => void;
  onCloseRoom: (room: AdminWatchParty) => void;
  isSuperAdmin: boolean;
}) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [members, setMembers] = useState<string[]>(initialRoom.members);
  const [syncState, setSyncState] = useState({ currentTime: initialRoom.currentTime, isPlaying: initialRoom.isPlaying });
  const [msgInput, setMsgInput] = useState('');
  const [seekInput, setSeekInput] = useState('');
  const [ctrlLoading, setCtrlLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'info'>('info');
  const [connected, setConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    watchPartySocket.connect(token);

    watchPartySocket.onJoined((data) => {
      setConnected(true);
      const d = data as { room?: { members?: string[] }; syncState?: { currentTime: number; isPlaying: boolean } };
      if (d.room?.members) setMembers(d.room.members);
      if (d.syncState) setSyncState(d.syncState);
    });

    watchPartySocket.onMessage((msg) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    watchPartySocket.onVideoPlay((s) => setSyncState({ currentTime: s.currentTime, isPlaying: true }));
    watchPartySocket.onVideoPause((s) => setSyncState({ currentTime: s.currentTime, isPlaying: false }));
    watchPartySocket.onVideoSeek((s) => setSyncState((prev) => ({ ...prev, currentTime: s.currentTime })));
    watchPartySocket.onVideoSync((s) => setSyncState({ currentTime: s.currentTime, isPlaying: s.isPlaying }));

    watchPartySocket.onMemberJoined(({ userId }) => {
      setMembers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
    });
    watchPartySocket.onMemberLeft(({ userId }) => {
      setMembers((prev) => prev.filter((m) => m !== userId));
    });
    watchPartySocket.onRoomClosed(() => {
      setConnected(false);
    });

    watchPartySocket.joinRoom(initialRoom._id);

    return () => {
      watchPartySocket.leaveRoom();
      watchPartySocket.offAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoom._id, token]);

  useEffect(() => {
    if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSendMsg = () => {
    if (!msgInput.trim()) return;
    watchPartySocket.sendMessage(msgInput.trim());
    setMessages((prev) => [
      ...prev.slice(-199),
      { userId: 'admin', username: 'Admin', message: msgInput.trim(), timestamp: Date.now(), isAdmin: true },
    ]);
    setMsgInput('');
  };

  const handleControl = async (action: 'play' | 'pause' | 'seek') => {
    setCtrlLoading(true);
    try {
      const time = action === 'seek' ? parseFloat(seekInput) || 0 : undefined;
      await watchPartiesApi.control(initialRoom._id, action, time);
      if (action === 'seek' && time !== undefined) {
        setSyncState((prev) => ({ ...prev, currentTime: time }));
        setSeekInput('');
      }
    } finally { setCtrlLoading(false); }
  };

  const pct = progressPct(syncState.currentTime, initialRoom.videoDuration);

  return (
    <div className="flex flex-col h-full bg-[#0a0a10] border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{initialRoom.name ?? initialRoom.inviteCode}</p>
            {connected
              ? <span className="flex items-center gap-1 text-[10px] text-emerald-400 shrink-0"><Radio size={9} className="animate-pulse" /> Live</span>
              : <span className="text-[10px] text-text-dim shrink-0">Подключение...</span>
            }
          </div>
          {initialRoom.videoTitle && (
            <p className="text-xs text-text-muted truncate mt-0.5">{initialRoom.videoTitle}</p>
          )}
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-white hover:bg-white/10 transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>

      {/* Video status */}
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-xs">
            <StatusDot status={syncState.isPlaying ? 'playing' : 'paused'} />
            <span className="text-text-muted font-mono">{formatTime(syncState.currentTime)}</span>
            {initialRoom.videoDuration && (
              <span className="text-text-dim">/ {formatTime(initialRoom.videoDuration)}</span>
            )}
          </div>
          {initialRoom.videoPlatform && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${PLATFORM_BG[initialRoom.videoPlatform] ?? 'bg-white/5 text-text-dim'}`}>
              {initialRoom.videoPlatform}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => void handleControl('play')}
            disabled={ctrlLoading}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            <Play size={11} /> Play
          </button>
          <button
            onClick={() => void handleControl('pause')}
            disabled={ctrlLoading}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-text-muted text-xs hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Pause size={11} /> Pause
          </button>
          <div className="flex items-center gap-1 flex-1">
            <input
              placeholder="сек."
              value={seekInput}
              onChange={(e) => setSeekInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleControl('seek')}
              className="w-16 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-text-dim focus:outline-none focus:border-accent/40 transition-colors"
            />
            <button
              onClick={() => void handleControl('seek')}
              disabled={ctrlLoading || !seekInput}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-text-muted text-xs hover:bg-white/10 disabled:opacity-40 transition-colors"
            >
              <SkipForward size={11} /> Seek
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        {(['info', 'chat', 'members'] as const).map((tab) => {
          const labels = { info: 'Инфо', chat: `Чат${messages.length ? ` (${messages.length})` : ''}`, members: `Участники (${members.length})` };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-accent'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="p-4 flex flex-col gap-3">
            <InfoRow label="Комната ID" value={<span className="font-mono text-xs">{initialRoom._id.slice(-12)}</span>} />
            <InfoRow label="Invite Code" value={<span className="font-mono text-accent">{initialRoom.inviteCode}</span>} />
            <InfoRow label="Владелец" value={<span className="font-mono text-xs">{initialRoom.ownerId.slice(-12)}</span>} />
            <InfoRow label="Приватная" value={initialRoom.isPrivate ? <span className="text-amber-400">Да</span> : <span className="text-text-muted">Нет</span>} />
            {initialRoom.videoUrl && (
              <InfoRow label="URL" value={
                <a href={initialRoom.videoUrl} target="_blank" rel="noopener noreferrer" className="text-accent text-xs break-all hover:underline flex items-center gap-1">
                  <LinkIcon size={10} /> {initialRoom.videoUrl.slice(0, 60)}{initialRoom.videoUrl.length > 60 ? '…' : ''}
                </a>
              } />
            )}
            {initialRoom.domain && (
              <InfoRow label="Домен" value={
                <Link to="/domains" className="text-accent text-xs hover:underline flex items-center gap-1">
                  <Globe size={10} /> {initialRoom.domain}
                </Link>
              } />
            )}
            {initialRoom.isSuspicious && (
              <InfoRow label="Подозр." value={
                <span className="text-red-400 text-xs">{initialRoom.suspiciousReason ?? 'Подозрительный контент'}</span>
              } />
            )}
            <InfoRow label="Создана" value={<span className="text-xs">{new Date(initialRoom.createdAt).toLocaleString('ru-RU')}</span>} />

            {isSuperAdmin && initialRoom.status !== 'ended' && (
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/[0.06]">
                <p className="text-[11px] text-text-dim uppercase tracking-wider font-semibold">Действия</p>
                <button
                  onClick={() => onBlockRoom(initialRoom)}
                  className="flex items-center gap-2 h-8 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                >
                  <ShieldOff size={12} /> Заблокировать комнату
                </button>
                <button
                  onClick={() => onCloseRoom(initialRoom)}
                  className="flex items-center gap-2 h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                >
                  <XCircle size={12} /> Принудительно закрыть
                </button>
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-text-dim">
                  <MessageSquare size={20} className="mb-2 opacity-30" />
                  <p className="text-xs">Сообщений пока нет</p>
                </div>
              ) : messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-0.5 ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed ${
                    msg.isAdmin
                      ? 'bg-accent/20 text-white rounded-br-sm'
                      : 'bg-white/[0.06] text-white rounded-bl-sm'
                  }`}>
                    {!msg.isAdmin && (
                      <p className="text-[10px] text-text-dim font-medium mb-0.5">
                        {msg.username ?? msg.userId.slice(-6)}
                      </p>
                    )}
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-text-dim px-1">
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="p-3 flex flex-col gap-1.5">
            {members.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-xs">Участников нет</div>
            ) : members.map((uid) => (
              <div key={uid} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {uid.slice(-2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium">Участник</p>
                    <p className="font-mono text-[10px] text-text-dim">{uid.slice(-12)}</p>
                  </div>
                </div>
                {uid === initialRoom.ownerId && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Владелец</span>
                )}
                {isSuperAdmin && uid !== initialRoom.ownerId && (
                  <button
                    onClick={() => void onKick(uid)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Выгнать"
                  >
                    <UserMinus size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat input (always visible when chat tab) */}
      {activeTab === 'chat' && (
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 focus-within:border-accent/40 transition-colors">
            <input
              placeholder="Написать в чат как Admin..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
              className="flex-1 bg-transparent text-xs text-white placeholder-text-dim focus:outline-none"
            />
            <button
              onClick={handleSendMsg}
              disabled={!msgInput.trim()}
              className="w-6 h-6 flex items-center justify-center text-accent disabled:opacity-30 transition-opacity"
            >
              <Send size={13} />
            </button>
          </div>
          <p className="text-[10px] text-text-dim mt-1 text-center">Сообщение отправится от имени Admin в чат комнаты</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-text-dim w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-white flex-1">{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function WatchPartiesPage() {
  const currentUser  = useAuthStore((s) => s.user);
  const token        = useAuthStore((s) => s.token);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [rooms, setRooms]         = useState<AdminWatchParty[]>([]);
  const [meta, setMeta]           = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [suspiciousOnly, setSusp] = useState(false);
  const [page, setPage]           = useState(1);
  const [selectedRoom, setSelected] = useState<AdminWatchParty | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [confirmModal, setConfirm] = useState<{ room: AdminWatchParty } | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [blockModal, setBlockModal]  = useState<{ room: AdminWatchParty } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (suspiciousOnly) params.suspicious = true;
      const res = await watchPartiesApi.list(params as Parameters<typeof watchPartiesApi.list>[0]);
      setRooms(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, statusFilter, suspiciousOnly]);

  useEffect(() => { void load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => void load(true), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleForceClose = async () => {
    if (!confirmModal) return;
    setActionLoading(confirmModal.room._id);
    try {
      await watchPartiesApi.closeRoom(confirmModal.room._id, closeReason.trim() || undefined);
      setConfirm(null); setCloseReason('');
      if (selectedRoom?._id === confirmModal.room._id) setSelected(null);
      await load(true);
    } finally { setActionLoading(null); }
  };

  const handleBlockRoom = async () => {
    if (!blockModal) return;
    setActionLoading(blockModal.room._id);
    try {
      await watchPartiesApi.blockRoom(blockModal.room._id, blockReason.trim() || undefined);
      setBlockModal(null); setBlockReason('');
      await load(true);
    } finally { setActionLoading(null); }
  };

  const handleKick = async (userId: string) => {
    if (!selectedRoom) return;
    await watchPartiesApi.kickMember(selectedRoom._id, userId);
  };

  const suspicious = rooms.filter((r) => r.isSuspicious).length;
  const active = rooms.filter((r) => r.status === 'playing').length;

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 overflow-hidden -m-6">
      {/* Left: List */}
      <div className={`flex flex-col min-w-0 transition-all duration-300 ${selectedRoom ? 'w-[58%]' : 'w-full'}`}>
        <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Watch Parties</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-text-muted text-sm">{meta.total} комнат</span>
                {active > 0 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Radio size={10} className="animate-pulse" /> {active} активных
                  </span>
                )}
                {suspicious > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertTriangle size={10} /> {suspicious} подозрительных
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => void load(true)}
              disabled={refreshing}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.08] text-text-dim hover:text-white hover:border-white/20 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Всего', value: meta.total, color: 'text-white' },
              { label: 'Активных', value: rooms.filter((r) => r.status === 'playing').length, color: 'text-emerald-400' },
              { label: 'Ожидают', value: rooms.filter((r) => r.status === 'waiting').length, color: 'text-amber-400' },
              { label: 'Подозр.', value: suspicious, color: 'text-red-400' },
            ].map((s) => (
              <div key={s.label} className="bg-[#0d0d14] border border-white/[0.06] rounded-xl px-3 py-2.5">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-text-dim mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { v: '', label: 'Все' },
              { v: 'playing', label: '▶ Идёт' },
              { v: 'waiting', label: '◷ Ожидает' },
              { v: 'paused', label: '⏸ Пауза' },
              { v: 'ended', label: '✗ Завершён' },
            ].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => { setStatus(v); setPage(1); }}
                className={`h-8 px-3 rounded-xl text-xs border transition-all ${
                  statusFilter === v
                    ? 'bg-accent/15 border-accent/30 text-accent'
                    : 'bg-[#0d0d14] border-white/[0.06] text-text-muted hover:border-white/20 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setSusp((v) => !v); setPage(1); }}
              className={`h-8 px-3 rounded-xl text-xs border transition-all flex items-center gap-1.5 ${
                suspiciousOnly
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : 'bg-[#0d0d14] border-white/[0.06] text-text-muted hover:border-white/20 hover:text-white'
              }`}
            >
              <AlertTriangle size={11} /> Подозрительные
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden">
                  <div className="h-28 bg-white/[0.03] animate-pulse" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3.5 bg-white/[0.05] rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-white/[0.03] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <Tv2 size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Watch Parties не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  isSelected={selectedRoom?._id === room._id}
                  isSuperAdmin={isSuperAdmin}
                  onSelect={() => setSelected(selectedRoom?._id === room._id ? null : room)}
                  onBlock={() => setBlockModal({ room })}
                  onClose={() => setConfirm({ room })}
                />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
          )}
        </div>
      </div>

      {/* Right: Monitor Panel */}
      {selectedRoom && token && (
        <div className="w-[42%] shrink-0 border-l border-white/[0.06] overflow-hidden flex flex-col">
          <MonitorPanel
            room={selectedRoom}
            token={token}
            onClose={() => setSelected(null)}
            onKick={handleKick}
            onBlockRoom={(r) => setBlockModal({ room: r })}
            onCloseRoom={(r) => setConfirm({ room: r })}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      )}

      {/* Block modal */}
      <Modal open={!!blockModal} onClose={() => { setBlockModal(null); setBlockReason(''); }} title="Заблокировать комнату">
        {blockModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Заблокировать комнату{' '}
              <span className="text-white font-medium font-mono">{blockModal.room.inviteCode}</span>?
            </p>
            <textarea
              placeholder="Причина блокировки..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={2}
              className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setBlockModal(null); setBlockReason(''); }}>Отмена</Button>
              <Button variant="danger" loading={!!actionLoading} onClick={() => void handleBlockRoom()}>Заблокировать</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Force close modal */}
      <Modal open={!!confirmModal} onClose={() => { setConfirm(null); setCloseReason(''); }} title="Закрыть комнату">
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Принудительно закрыть комнату{' '}
              <span className="text-white font-medium font-mono">{confirmModal.room.inviteCode}</span>?
              Все участники будут выгнаны.
            </p>
            <textarea
              placeholder="Причина (будет видна участникам)..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={2}
              className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setConfirm(null); setCloseReason(''); }}>Отмена</Button>
              <Button variant="danger" loading={!!actionLoading} onClick={() => void handleForceClose()}>Закрыть</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
