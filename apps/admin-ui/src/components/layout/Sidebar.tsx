import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', end: true },
  { to: '/users', icon: '👥', label: 'Foydalanuvchilar' },
  { to: '/movies', icon: '🎬', label: 'Kontent' },
  { to: '/feedback', icon: '💬', label: 'Feedback' },
  { to: '/logs', icon: '📋', label: 'Loglar' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <span className="text-primary font-bold text-lg tracking-tight">CINESYNC</span>
        <span className="ml-2 text-xs text-text-muted bg-overlay rounded px-1.5 py-0.5">ADMIN</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-text-muted hover:bg-overlay hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-border">
        {user && (
          <div className="mb-3 px-2">
            <p className="text-xs font-medium text-white truncate">{user.email}</p>
            <p className="text-xs text-text-muted capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          🚪 Chiqish
        </button>
      </div>
    </aside>
  );
}
