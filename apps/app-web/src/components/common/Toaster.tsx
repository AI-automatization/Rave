'use client';

import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toast.store';

// This component used to render DaisyUI classes — `toast toast-top toast-end`, `alert
// alert-success`. DaisyUI is not installed in this app (package.json: tailwindcss +
// tailwindcss-animate only) and none of those classes are defined in globals.css, so every toast
// in the app rendered as unstyled, unpositioned text at the end of the document — effectively
// invisible. That is the root cause of "sending a friend request gives no feedback" in the prod
// audit (2026-08-01): the request succeeded and the toast fired, nobody could see it.
// Ranglar WW v2 tokenlaridan (`Notice` bilan bir xil til): chegara turni
// ko'rsatadi, ikonka esa uni takrorlaydi — holat faqat rangga tayanmasin.
const STYLES: Record<string, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2,  ring: 'rgba(74,222,128,0.32)',  iconColor: 'text-[var(--ww-success)]' },
  error:   { icon: XCircle,       ring: 'var(--ww-danger-line)',  iconColor: 'text-[var(--ww-danger)]' },
  warning: { icon: AlertTriangle, ring: 'rgba(245,197,66,0.32)',  iconColor: 'text-[var(--ww-gold)]' },
  info:    { icon: Info,          ring: 'rgba(124,58,237,0.32)',  iconColor: 'text-[var(--ww-accent-hi)]' },
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
            className="ww-rise group pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-[var(--ww-r-md)] border bg-[var(--ww-panel-solid)] px-3.5 py-3"
            style={{ borderColor: style.ring }}
          >
            <Icon size={16} aria-hidden="true" className={`${style.iconColor} mt-px shrink-0`} />
            <span className="flex-1 text-[13.5px] leading-snug text-[var(--ww-text)]">{t.message}</span>
            <X size={14} aria-hidden="true" className="mt-px shrink-0 text-[var(--ww-text-4)] transition-colors group-hover:text-[var(--ww-text-2)]" />
          </div>
        );
      })}
    </div>
  );
}
