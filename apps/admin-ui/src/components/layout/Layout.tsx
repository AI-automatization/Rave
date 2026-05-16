import { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/auth.store';
import { errorsApi } from '../../api/errors.api';
import { usersApi } from '../../api/users.api';
import { moviesApi } from '../../api/movies.api';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/movies': 'Content',
  '/battles': 'Battles',
  '/watchparties': 'Watch Parties',
  '/errors': 'Mobile Errors',
  '/support': 'Support',
  '/room-reports': 'Reports',
  '/appeals': 'Appeals',
  '/feedback': 'Feedback',
  '/logs': 'Logs',
  '/user-activity': 'Activity',
  '/audit-logs': 'Audit Logs',
  '/staff': 'Staff',
  '/domains': 'Domains',
  '/settings': 'Settings',
};

interface SearchResult {
  type: 'user' | 'error' | 'movie';
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
        const [users, errors, movies] = await Promise.allSettled([
          usersApi.list({ search: q, limit: 5 }),
          errorsApi.list({ search: q, limit: 5 }),
          moviesApi.list({ search: q, limit: 5 }),
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
        if (movies.status === 'fulfilled') {
          movies.value.data.forEach((m) => r.push({
            type: 'movie', id: m._id,
            title: m.title,
            subtitle: `${m.year} · ${m.type}`,
            to: '/movies',
          }));
        }
        setResults(r);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-raised border border-white/[0.1] rounded-2xl shadow-modal overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
            <Search size={15} className="text-text-dim shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users, errors..."
              className="flex-1 bg-transparent text-[13px] text-white placeholder-text-dim outline-none"
              onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            />
            <div className="flex items-center gap-1">
              <kbd className="text-[10px] text-text-dim bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 font-mono">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          {(results.length > 0 || loading) && (
            <div className="py-1.5 max-h-80 overflow-y-auto no-scrollbar">
              {loading && (
                <p className="text-text-muted text-xs px-4 py-2.5">Searching...</p>
              )}
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { navigate(r.to); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    r.type === 'user'  ? 'bg-blue-500/15 text-blue-400' :
                    r.type === 'movie' ? 'bg-violet-500/15 text-violet-400' :
                                        'bg-red-500/15 text-red-400'
                  }`}>
                    {r.type === 'user' ? 'USER' : r.type === 'movie' ? 'FILM' : 'ERR'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white truncate group-hover:text-white">{r.title}</p>
                    <p className="text-[11px] text-text-muted truncate">{r.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {q && !loading && results.length === 0 && (
            <p className="text-text-muted text-[13px] px-4 py-4">No results for &ldquo;{q}&rdquo;</p>
          )}

          {!q && (
            <div className="px-4 py-3 flex items-center gap-4 text-[11px] text-text-dim">
              <span className="flex items-center gap-1.5">
                <kbd className="bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                open
              </span>
            </div>
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

  // Avatar
  const hue = user?.email ? (user.email.charCodeAt(0) * 137) % 360 : 240;
  const avatarBg = `hsl(${hue},40%,18%)`;
  const avatarColor = `hsl(${hue},70%,65%)`;
  const initials = (user?.email ?? 'A').slice(0, 2).toUpperCase();

  const fetchErrors = useCallback(() => {
    errorsApi.stats().then((s) => setNewErrors(s.new)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchErrors();
    const t = setInterval(fetchErrors, 30_000);
    return () => clearInterval(t);
  }, [fetchErrors]);

  // ⌘K shortcut
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

  const isSupport = location.pathname === '/support';

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header — h-[53px] matching sidebar logo height */}
        <header className="sticky top-0 z-10 h-[53px] flex items-center gap-4 px-5 border-b border-white/[0.055] bg-bg/90 backdrop-blur-md shrink-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-text-dim text-[13px] hidden md:block select-none">Rave</span>
            <span className="text-text-dim text-[13px] hidden md:block select-none">/</span>
            <span className="text-white text-[13px] font-medium truncate">{pageLabel}</span>
          </div>

          <div className="flex-1" />

          {/* Search pill */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 h-[30px] px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-text-dim hover:text-[#c4c3dc] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-150 text-[12px]"
          >
            <Search size={12} />
            <span>Search</span>
            <kbd className="ml-1 text-[10px] bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0.5 font-mono">⌘K</kbd>
          </button>

          {/* Bell */}
          <button className="relative p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.05] transition-colors">
            <Bell size={16} />
            {newErrors > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-bg" />
            )}
          </button>

          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold cursor-default shrink-0"
            style={{ background: avatarBg, color: avatarColor }}
          >
            {initials}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {isSupport ? (
            <Outlet />
          ) : (
            <div className="flex-1 overflow-auto no-scrollbar">
              <div className="max-w-7xl mx-auto px-6 py-6">
                <Outlet />
              </div>
            </div>
          )}
        </main>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
