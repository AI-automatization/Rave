import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      if (data.user.role !== 'admin' && data.user.role !== 'superadmin' && data.user.role !== 'operator') {
        setError('Admin yoki operator roli talab qilinadi');
        return;
      }
      setAuth(data.accessToken, data.user);
      navigate('/');
    } catch {
      setError('Email yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-white font-semibold text-xl tracking-widest uppercase">CineSync</span>
          <p className="text-text-dim text-xs mt-1 font-mono">admin</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h1 className="text-lg font-semibold text-white mb-5">Kirish</h1>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@cinesync.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Parol"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button variant="primary" type="submit" loading={loading} className="w-full justify-center mt-1">
              Kirish
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
