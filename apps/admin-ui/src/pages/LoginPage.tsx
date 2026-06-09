import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, Users, Film, Tv2, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { WeWatchLogo } from '../components/ui/WeWatchLogo';

const FEATURES = [
  { icon: <Users size={13} />, text: 'Управление пользователями' },
  { icon: <Film size={13} />, text: 'Модерация контента' },
  { icon: <Tv2 size={13} />, text: 'Мониторинг Watch Parties' },
  { icon: <ShieldCheck size={13} />, text: 'Безопасность и аудит' },
];

export function LoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      if (!['admin', 'superadmin', 'operator'].includes(data.user.role)) {
        setError('Доступ запрещён — требуется роль admin или operator');
        return;
      }
      setAuth(data.accessToken, data.refreshToken, data.user);
      navigate('/');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Background atmosphere ── */}
      <div className="absolute inset-0 bg-grid-lines opacity-30 pointer-events-none" />
      <div className="pointer-events-none select-none">
        <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[700px] h-[380px] bg-accent/7 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-violet-600/5 rounded-full blur-[90px]" />
        <div className="absolute top-[10%] left-[-8%] w-56 h-56 bg-blue-600/5 rounded-full blur-[70px]" />
        <div className="absolute bottom-[20%] left-[30%] w-48 h-48 bg-indigo-500/4 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">

        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 w-20 h-20 rounded-3xl bg-accent/20 blur-2xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#0D0D1F] border border-accent/20 flex items-center justify-center shadow-[0_0_36px_rgba(124,58,237,0.30)]">
              <WeWatchLogo variant="mark" className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">WeWatch Admin</h1>
          <p className="text-text-muted text-sm mt-1">Панель управления платформой</p>
        </div>

        {/* ── Login card ── */}
        <div className="bg-card border border-white/[0.07] rounded-2xl overflow-hidden shadow-modal relative">
          {/* Top gradient line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />

          <div className="px-6 py-6">
            <h2 className="text-[15px] font-semibold text-white mb-5">Войти в панель</h2>

            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@wewatch.uz"
                    required
                    autoFocus
                    className="input-base pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Пароль</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-base pl-9"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5 animate-fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 h-11 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all duration-150
                  shadow-glow-sm hover:shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />Входим...</>
                  : 'Войти в панель'}
              </button>
            </form>
          </div>

          {/* Features strip */}
          <div className="px-6 pb-5">
            <div className="sep mb-4" />
            <div className="grid grid-cols-2 gap-1.5">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-[11px] text-text-dim">
                  <span className="text-text-muted shrink-0">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-text-ghost text-[11px] mt-5">
          WeWatch Admin · Только для авторизованного персонала
        </p>
      </div>
    </div>
  );
}
