import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/movies', label: 'Content' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/logs', label: 'Logs' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-52 bg-bg border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <span className="text-white font-semibold text-sm tracking-widest uppercase">CineSync</span>
        <span className="ml-2 text-[10px] text-text-dim bg-overlay rounded px-1.5 py-0.5 font-mono">admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
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
