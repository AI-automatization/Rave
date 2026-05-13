import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Film, Swords, Tv2,
  ScrollText, Activity, ShieldCheck, UserCog, Bug, LogOut,
  Globe, Flag, Scale, Settings, Sparkles, MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { errorsApi } from '../../api/errors.api';
import { supportApi } from '../../api/support.api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: number;
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto text-[10px] font-semibold bg-red-500/15 text-red-400 rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-px">
      <p className="px-2.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em] mb-1 mt-3 first:mt-1">
        {label}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-2 h-8 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              isActive
                ? 'bg-accent/[0.1] text-white'
                : 'text-[#6b6b8a] hover:bg-white/[0.04] hover:text-[#c4c3dc]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`shrink-0 transition-colors duration-150 ${
                  isActive ? 'text-accent' : 'text-[#4e4d6a] group-hover:text-[#8887a8]'
                }`}
              >
                {item.icon}
              </span>
              <span className="flex-1 truncate leading-none">{item.label}</span>
              {item.badge != null && <NavBadge count={item.badge} />}
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
  const [openSupportCount, setOpenSupportCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [pendingAppeals, setPendingAppeals] = useState(0);
  const [userHover, setUserHover] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchCounts = () => {
      import('../../api/moderation.api').then(({ moderationApi }) => {
        moderationApi.getCounts()
          .then((c) => { setPendingReports(c.reports); setPendingAppeals(c.appeals); })
          .catch(() => {});
      });
      errorsApi.stats().then((s) => setNewErrorCount(s.new)).catch(() => {});
      supportApi.openCount().then(setOpenSupportCount).catch(() => {});
    };
    fetchCounts();
    const t = setInterval(fetchCounts, 30_000);
    return () => clearInterval(t);
  }, []);

  // Avatar color based on email
  const hue = user?.email ? (user.email.charCodeAt(0) * 137) % 360 : 240;
  const avatarBg = `hsl(${hue},40%,18%)`;
  const avatarColor = `hsl(${hue},70%,65%)`;
  const initials = (user?.email ?? 'A').slice(0, 2).toUpperCase();

  const overviewItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={15} />, end: true },
  ];

  const platformItems: NavItem[] = [
    { to: '/users',       label: 'Users',        icon: <Users size={15} /> },
    { to: '/movies',      label: 'Content',       icon: <Film size={15} /> },
    { to: '/battles',     label: 'Battles',       icon: <Swords size={15} /> },
    { to: '/watchparties',label: 'Watch Parties', icon: <Tv2 size={15} /> },
  ];

  const monitoringItems: NavItem[] = [
    { to: '/errors',      label: 'Mobile Errors', icon: <Bug size={15} />,           badge: newErrorCount },
    { to: '/support',     label: 'Support',       icon: <MessageSquare size={15} />, badge: openSupportCount },
    { to: '/room-reports',label: 'Reports',       icon: <Flag size={15} />,          badge: pendingReports },
    { to: '/appeals',     label: 'Appeals',       icon: <Scale size={15} />,         badge: pendingAppeals },
    { to: '/logs',        label: 'Logs',          icon: <ScrollText size={15} /> },
    { to: '/user-activity',label: 'Activity',     icon: <Activity size={15} /> },
    { to: '/audit-logs',  label: 'Audit Logs',    icon: <ShieldCheck size={15} /> },
  ];

  const systemItems: NavItem[] = [
    { to: '/domains', label: 'Domains', icon: <Globe size={15} /> },
    ...(isSuperAdmin ? [{ to: '/staff', label: 'Staff', icon: <UserCog size={15} /> }] : []),
    { to: '/settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col
          w-[220px] bg-bg border-r border-white/[0.055]
          transition-transform duration-200 ease-spring
          md:static md:translate-x-0 md:h-screen md:sticky md:top-0 md:shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo — same height as header (53px) */}
        <div className="h-[53px] px-4 flex items-center border-b border-white/[0.055] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center shrink-0 shadow-glow-sm">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[13px] leading-none">Rave</p>
              <p className="text-text-dim text-[10px] mt-0.5 leading-none">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 flex flex-col overflow-y-auto no-scrollbar">
          <NavGroup label="Overview"   items={overviewItems} />
          <NavGroup label="Platform"   items={platformItems} />
          <NavGroup label="Monitoring" items={monitoringItems} />
          <NavGroup label="System"     items={systemItems} />
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t border-white/[0.055] shrink-0">
          <div
            className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 hover:bg-white/[0.04] cursor-default"
            onMouseEnter={() => setUserHover(true)}
            onMouseLeave={() => setUserHover(false)}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
              style={{ background: avatarBg, color: avatarColor }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-white truncate leading-none">{user?.email ?? ''}</p>
              <p className="text-[10px] text-text-dim capitalize mt-0.5 leading-none">{user?.role ?? 'admin'}</p>
            </div>
            <button
              onClick={logout}
              className={`
                shrink-0 p-1 rounded-md text-text-dim hover:text-red-400 transition-all duration-150
                ${userHover ? 'opacity-100' : 'opacity-0'}
              `}
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
