import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Film, Swords, Tv2, MessageSquare,
  ScrollText, Activity, ShieldCheck, UserCog, Bug, LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { errorsApi } from '../../api/errors.api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: number;
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-0.5 mt-2">{label}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group relative ${
              isActive
                ? 'bg-accent/12 text-accent font-medium'
                : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`shrink-0 transition-colors ${isActive ? 'text-accent' : 'text-text-dim group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const location = useLocation();
  const [newErrorCount, setNewErrorCount] = useState(0);

  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    errorsApi.stats().then((s) => setNewErrorCount(s.new)).catch(() => {});
    const t = setInterval(() => {
      errorsApi.stats().then((s) => setNewErrorCount(s.new)).catch(() => {});
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const mainItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} />, end: true },
  ];

  const contentItems: NavItem[] = [
    { to: '/users', label: 'Пользователи', icon: <Users size={16} /> },
    { to: '/movies', label: 'Контент', icon: <Film size={16} /> },
    { to: '/battles', label: 'Battles', icon: <Swords size={16} /> },
    { to: '/watchparties', label: 'Watch Parties', icon: <Tv2 size={16} /> },
  ];

  const monitoringItems: NavItem[] = [
    { to: '/errors', label: 'Mobile Errors', icon: <Bug size={16} />, badge: newErrorCount },
    { to: '/feedback', label: 'Feedback', icon: <MessageSquare size={16} /> },
    { to: '/logs', label: 'Logs', icon: <ScrollText size={16} /> },
    { to: '/user-activity', label: 'Активность', icon: <Activity size={16} /> },
    { to: '/audit-logs', label: 'Audit Logs', icon: <ShieldCheck size={16} /> },
  ];

  const superAdminItems: NavItem[] = [
    { to: '/staff', label: 'Сотрудники', icon: <UserCog size={16} /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 bg-[#0d0d14] border-r border-white/[0.06] flex flex-col
        transition-transform duration-200 ease-in-out
        md:static md:translate-x-0 md:h-screen md:sticky md:top-0 md:shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold text-xs">R</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">Rave</p>
              <p className="text-text-dim text-[10px] mt-0.5">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-text-dim hover:text-white">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0 overflow-y-auto scrollbar-thin">
          <NavGroup label="Главная" items={mainItems} />
          <NavGroup label="Контент" items={contentItems} />
          <NavGroup label="Мониторинг" items={monitoringItems} />
          {isSuperAdmin && <NavGroup label="Суперадмин" items={superAdminItems} />}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent text-xs font-bold uppercase">
                {user?.email?.[0] ?? 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.email}</p>
              <p className="text-[10px] text-text-dim capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
