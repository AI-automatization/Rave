'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IWatchPartyRoom } from '@/types';

export default function JoinPartyPage() {
  const router = useRouter();
  const { inviteCode } = useParams<{ inviteCode: string }>();

  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const join = async (pw?: string) => {
    if (!inviteCode) { router.replace('/home'); return; }
    setJoining(true);
    setError('');
    try {
      const res = await apiClient.post<ApiResponse<IWatchPartyRoom>>(
        `/watch-party/rooms/join/${inviteCode}`,
        pw ? { password: pw } : {},
      );
      const room = res.data.data;
      if (room?._id) {
        router.replace(`/party/${room._id}`);
      } else {
        router.replace('/home');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg === 'password_required') {
        setNeedsPassword(true);
      } else if (msg === 'Noto\'g\'ri parol') {
        setError('Noto\'g\'ri parol. Qayta urinib ko\'ring.');
      } else {
        logger.error('Watch Party ga qo\'shilishda xato', err);
        setError(msg || 'Xonaga kirib bo\'lmadi');
        setTimeout(() => router.replace('/home'), 2000);
      }
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => { void join(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Password form for private rooms
  if (needsPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <FaLock size={22} className="text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Yopiq xona</h1>
            <p className="text-sm text-slate-400">Kirish uchun parol kerak</p>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Parolni kiriting..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && password) void join(password); }}
              autoFocus
              className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 pr-11 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => router.replace('/home')}
              className="flex-1 h-10 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
            >
              Orqaga
            </button>
            <button
              onClick={() => void join(password)}
              disabled={!password || joining}
              className="flex-1 h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#6D28D9] transition-colors"
            >
              {joining ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="text-base-content/60">{error || 'Xonaga kirilmoqda...'}</p>
    </div>
  );
}
