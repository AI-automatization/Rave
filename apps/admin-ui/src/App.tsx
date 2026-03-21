import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { MoviesPage } from './pages/MoviesPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { LogsPage } from './pages/LogsPage';
import { BattlesPage } from './pages/BattlesPage';
import { WatchPartiesPage } from './pages/WatchPartiesPage';
import { SystemPage } from './pages/SystemPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserActivityPage } from './pages/UserActivityPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="battles" element={<BattlesPage />} />
          <Route path="watchparties" element={<WatchPartiesPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="user-activity" element={<UserActivityPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
