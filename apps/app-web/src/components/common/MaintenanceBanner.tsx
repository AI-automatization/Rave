'use client';

import { Wrench } from 'lucide-react';
import { useMaintenanceStore } from '@/store/maintenance.store';

export function MaintenanceBanner() {
  const isMaintenance = useMaintenanceStore((s) => s.isMaintenance);
  if (!isMaintenance) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2.5 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-sm text-amber-300">
      <Wrench size={14} className="shrink-0" />
      <span>Технические работы — сервис временно недоступен. Попробуйте позже.</span>
    </div>
  );
}
