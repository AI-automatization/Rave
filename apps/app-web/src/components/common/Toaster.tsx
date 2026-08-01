'use client';

import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toast.store';

// This component used to render DaisyUI classes — `toast toast-top toast-end`, `alert
// alert-success`. DaisyUI is not installed in this app (package.json: tailwindcss +
// tailwindcss-animate only) and none of those classes are defined in globals.css, so every toast
// in the app rendered as unstyled, unpositioned text at the end of the document — effectively
// invisible. That is the root cause of "sending a friend request gives no feedback" in the prod
// audit (2026-08-01): the request succeeded and the toast fired, nobody could see it.
const STYLES: Record<string, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2,  ring: 'rgba(52,211,153,0.30)',  iconColor: 'text-emerald-400' },
  error:   { icon: XCircle,       ring: 'rgba(229,62,62,0.32)',   iconColor: 'text-red-400' },
  warning: { icon: AlertTriangle, ring: 'rgba(251,191,36,0.30)',  iconColor: 'text-amber-400' },
  info:    { icon: Info,          ring: 'rgba(124,58,237,0.30)',  iconColor: 'text-violet-400' },
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  if (!toasts.length) return null;

  return (
    // Top on mobile (the floating dock owns the bottom of the screen), bottom-right from `sm`.
    // `pointer-events-none` on the stack so a toast never blocks a click underneath it; the
    // individual toasts re-enable it for their own dismiss.
    <div
      role="region"
      aria-live="polite"
      className="fixed z-[100] pointer-events-none flex flex-col gap-2 inset-x-3 top-3 sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-5 sm:w-80"
    >
      {toasts.map((t) => {
        const style = STYLES[t.type] ?? STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="alert"
            onClick={() => remove(t.id)}
            className="liquid-glass-sm pointer-events-auto cursor-pointer flex items-start gap-2.5 px-3.5 py-3 animate-fade-slide-in group"
            style={{ borderColor: style.ring }}
          >
            <Icon size={16} className={`${style.iconColor} shrink-0 mt-px`} />
            <span className="flex-1 text-sm text-white leading-snug">{t.message}</span>
            <X size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 mt-px" />
          </div>
        );
      })}
    </div>
  );
}
