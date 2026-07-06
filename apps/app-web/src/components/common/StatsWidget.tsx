'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function StatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetch_ = () =>
      fetch('/api/stats').then(r => r.json()).then((d: Stats) => setStats(d)).catch(() => {});
    fetch_();
    const t = setInterval(fetch_, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!stats || stats.totalUsers === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium"
      style={{
        background: 'rgba(13,13,20,0.85)',
        border: '1px solid rgba(123,114,248,0.2)',
        backdropFilter: 'blur(12px)',
        color: '#a1a1aa',
      }}
    >
      {/* Live dot */}
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      <span style={{ color: '#4ade80' }}>{formatNumber(stats.activeUsers)}</span>
      <span className="text-zinc-600">·</span>
      <span style={{ color: '#7B72F8' }}>{formatNumber(stats.totalUsers)}</span>
      <span className="text-zinc-600 text-[10px]">онлайн</span>
    </div>
  );
}
