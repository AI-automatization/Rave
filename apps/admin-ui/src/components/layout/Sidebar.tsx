import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  LayoutDashboard, Users, Tv2,
  ScrollText, Activity, ShieldCheck, UserCog, Bug, LogOut,
  Globe, Flag, Scale, Settings, MessageSquare, Bell, BarChart2, ShieldAlert, Mail, Languages,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { errorsApi } from '../../api/errors.api';
import { supportApi } from '../../api/support.api';
import { WeWatchLogo } from '../ui/WeWatchLogo';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'uz', label: 'UZ' },
] as const;

function LanguageSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  const current = i18nHook.language.slice(0, 2) as 'ru' | 'en' | 'uz';

  const change = (code: 'ru' | 'en' | 'uz') => {
    void i18n.changeLanguage(code);
    localStorage.setItem('admin-lang', code);
  };

  return (
    <div className="flex items-center gap-1 px-2.5 py-2">
      <Languages size={12} className="text-text-dim shrink-0 mr-1" />
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => change(code)}
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded transition-all duration-150 ${
            current === code
              ? 'bg-accent/20 text-accent'
              : 'text-text-dim hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
  const { t } = useTranslation();
  const isSuperAdmin = user?.role === 'superadmin';
  const location = useLocation();
  const [newErrorCount, setNewErrorCount] = useState(0);
  const [openSupportCount, setOpenSupportCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [pendingUserReports, setPendingUserReports] = useState(0);
  const [pendingAppeals, setPendingAppeals] = useState(0);
  const [userHover, setUserHover] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchCounts = () => {
      import('../../api/moderation.api').then(({ moderationApi }) => {
        moderationApi.getCounts()
          .then((c) => {
            setPendingReports(c.reports);
            setPendingAppeals(c.appeals);
            setPendingUserReports(c.userReports);
          })
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
    { to: '/',          label: t('nav.dashboard'), icon: <LayoutDashboard size={15} />, end: true },
    { to: '/analytics', label: t('nav.analytics'), icon: <BarChart2 size={15} /> },
  ];

  const platformItems: NavItem[] = [
    { to: '/users',         label: t('nav.users'),         icon: <Users size={15} /> },
    { to: '/watchparties',  label: t('nav.watchParties'),   icon: <Tv2 size={15} /> },
    { to: '/notifications', label: t('nav.notifications'),  icon: <Bell size={15} /> },
    { to: '/campaigns',     label: t('nav.campaigns'),      icon: <Mail size={15} /> },
  ];

  const monitoringItems: NavItem[] = [
    { to: '/errors',       label: t('nav.mobileErrors'),   icon: <Bug size={15} />,           badge: newErrorCount },
    { to: '/support',      label: t('nav.support'),        icon: <MessageSquare size={15} />, badge: openSupportCount },
    { to: '/room-reports', label: t('nav.roomReports'),    icon: <Flag size={15} />,          badge: pendingReports },
    { to: '/user-reports', label: t('nav.userReports'),    icon: <Flag size={15} />,          badge: pendingUserReports },
    { to: '/appeals',      label: t('nav.appeals'),        icon: <Scale size={15} />,         badge: pendingAppeals },
    { to: '/logs',         label: t('nav.logs'),           icon: <ScrollText size={15} /> },
    { to: '/user-activity',label: t('nav.activity'),       icon: <Activity size={15} /> },
    { to: '/audit-logs',   label: t('nav.auditLogs'),      icon: <ShieldCheck size={15} /> },
  ];

  const systemItems: NavItem[] = [
    { to: '/domains',      label: t('nav.domains'),      icon: <Globe size={15} /> },
    { to: '/banned-words', label: t('nav.bannedWords'),   icon: <ShieldAlert size={15} /> },
    ...(isSuperAdmin ? [{ to: '/staff', label: t('nav.staff'), icon: <UserCog size={15} /> }] : []),
    { to: '/settings',     label: t('nav.settings'),     icon: <Settings size={15} /> },
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
            <WeWatchLogo variant="mark" className="w-7 h-7 shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-semibold text-[13px] leading-none">WeWatch</p>
              <p className="text-text-dim text-[10px] mt-0.5 leading-none">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 flex flex-col overflow-y-auto no-scrollbar">
          <NavGroup label={t('nav.overview')}   items={overviewItems} />
          <NavGroup label={t('nav.platform')}   items={platformItems} />
          <NavGroup label={t('nav.monitoring')} items={monitoringItems} />
          <NavGroup label={t('nav.system')}     items={systemItems} />
        </nav>

        {/* Language switcher */}
        <div className="border-t border-white/[0.055] shrink-0">
          <LanguageSwitcher />
        </div>

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
