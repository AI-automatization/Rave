import { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/auth.store';
import { errorsApi } from '../../api/errors.api';
import { usersApi } from '../../api/users.api';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Пользователи',
  '/movies': 'Контент',
  '/battles': 'Battles',
  '/watchparties': 'Watch Parties',
  '/errors': 'Mobile Errors',
  '/feedback': 'Feedback',
  '/logs': 'Logs',
  '/user-activity': 'Активность',
  '/audit-logs': 'Audit Logs',
  '/staff': 'Сотрудники',
};

interface SearchResult {
  type: 'user' | 'error';
  id: string;
  title: string;
  subtitle: string;
  to: string;
}

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [users, errors] = await Promise.allSettled([
          usersApi.list({ search: q, limit: 5 }),
          errorsApi.list({ search: q, limit: 5 }),
        ]);
        const r: SearchResult[] = [];
        if (users.status === 'fulfilled') {
          users.value.data.forEach((u) => r.push({
            type: 'user', id: u._id,
            title: u.username || u.email,
            subtitle: u.email,
            to: `/users/${u._id}`,
          }));
        }
        if (errors.status === 'fulfilled') {
          errors.value.data.forEach((e) => r.push({
            type: 'error', id: e.id,
            title: e.title,
            subtitle: e.message || e.platform,
            to: '/errors',
          }));
        }
        setResults(r);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="w-full max-w-xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#13131f] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <Search size={16} className="text-text-dim shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск пользователей, ошибок..."
              className="flex-1 bg-transparent text-sm text-white placeholder-text-dim outline-none"
              onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            />
            <kbd className="text-[10px] text-text-dim bg-overlay rounded px-1.5 py-0.5">ESC</kbd>
          </div>
          {(results.length > 0 || loading) && (
            <div className="py-2 max-h-80 overflow-y-auto">
              {loading && <p className="text-text-muted text-xs px-4 py-2">Поиск...</p>}
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { navigate(r.to); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    r.type === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                  }`}>{r.type === 'user' ? 'USER' : 'ERR'}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.title}</p>
                    <p className="text-xs text-text-muted truncate">{r.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {q && !loading && results.length === 0 && (
            <p className="text-text-muted text-xs px-4 py-3">Ничего не найдено</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newErrors, setNewErrors] = useState(0);
  const location = useLocation();
  const { user } = useAuthStore();

  const pageLabel = ROUTE_LABELS[location.pathname] ?? 'Rave Admin';

  const fetchErrors = useCallback(() => {
    errorsApi.stats().then((s) => setNewErrors(s.new)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchErrors();
    const t = setInterval(fetchErrors, 30_000);
    return () => clearInterval(t);
  }, [fetchErrors]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a10]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 h-14 flex items-center gap-4 px-5 border-b border-white/[0.06] bg-[#0a0a10]/80 backdrop-blur-md">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-md text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-text-dim hidden md:block">Rave</span>
            <span className="text-text-dim hidden md:block">/</span>
            <span className="text-white font-medium truncate">{pageLabel}</span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-dim hover:text-white hover:border-white/10 transition-all text-xs"
          >
            <Search size={13} />
            <span>Поиск</span>
            <kbd className="ml-1 text-[10px] bg-white/5 rounded px-1 py-0.5">⌘K</kbd>
          </button>

          {/* Notifications bell */}
          <button className="relative p-2 rounded-lg text-text-dim hover:text-white hover:bg-white/5 transition-colors">
            <Bell size={17} />
            {newErrors > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center cursor-default">
            <span className="text-accent text-xs font-bold uppercase">{user?.email?.[0] ?? 'A'}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-5 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
