import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/movies', label: 'Content' },
  { to: '/battles', label: 'Battles' },
  { to: '/watchparties', label: 'Watch Parties' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/logs', label: 'Logs' },
  { to: '/user-activity', label: 'User Activity' },
  { to: '/audit-logs', label: 'Audit Logs' },
  { to: '/system', label: 'System' },
];

// Superadmin-only nav items
const superAdminItems = [
  { to: '/staff', label: 'Staff' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-52 bg-bg border-r border-border flex flex-col
      transition-transform duration-200 ease-in-out
      md:static md:translate-x-0 md:h-screen md:sticky md:top-0 md:shrink-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-white font-semibold text-sm tracking-widest uppercase">CineSync</span>
          <span className="ml-2 text-[10px] text-text-dim bg-overlay rounded px-1.5 py-0.5 font-mono">admin</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 text-text-muted hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-muted hover:bg-overlay hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {isSuperAdmin && (
          <>
            <div className="mx-3 my-1.5 border-t border-border/50" />
            <p className="px-3 text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-0.5">
              Superadmin
            </p>
            {superAdminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-red-500/10 text-red-400 font-medium'
                      : 'text-text-muted hover:bg-overlay hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3 border-t border-border">
        {user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-white truncate">{user.email}</p>
            <p className="text-[11px] text-text-dim capitalize mt-0.5">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-white hover:bg-overlay rounded-md transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
