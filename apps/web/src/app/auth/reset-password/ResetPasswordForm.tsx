'use client';

import { useState, useTransition } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  token: string | null;
}

export function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="w-14 h-14 text-red-400" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white">Ссылка недействительна</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Токен сброса пароля отсутствует. Запросите новую ссылку в приложении WeWatch.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-400" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white">Пароль изменён</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Вы можете войти в приложение WeWatch с новым паролем.
        </p>
        <a
          href="wewatch://"
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          Открыть WeWatch
        </a>
      </div>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort  = password.length > 0 && password.length < 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch || tooShort || !password) return;

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword: password }),
          });
          if (res.ok) {
            setStatus('success');
          } else {
            const data = await res.json() as { message?: string };
            setErrorMsg(data.message ?? 'Ошибка сброса пароля');
            setStatus('error');
          }
        } catch {
          setErrorMsg('Не удалось подключиться к серверу');
          setStatus('error');
        }
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* New password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">Новый пароль</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setStatus('idle'); }}
            placeholder="Минимум 8 символов"
            required
            autoFocus
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {tooShort && (
          <p className="text-xs text-red-400">Пароль должен быть не менее 8 символов</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">Повторите пароль</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showCf ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setStatus('idle'); }}
            placeholder="Повторите пароль"
            required
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowCf((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {mismatch && (
          <p className="text-xs text-red-400">Пароли не совпадают</p>
        )}
      </div>

      {/* API error */}
      {status === 'error' && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5">
          <XCircle size={14} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || mismatch || tooShort || !password || !confirm}
        className="w-full mt-1 h-10 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {isPending
          ? <><Loader2 size={15} className="animate-spin" />Сохраняем...</>
          : 'Сохранить новый пароль'}
      </button>
    </form>
  );
}
