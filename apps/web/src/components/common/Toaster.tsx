'use client';

import { useToastStore } from '@/store/toast.store';

const ALERT_CLASS: Record<string, string> = {
  success: 'alert-success',
  error:   'alert-error',
  warning: 'alert-warning',
  info:    'alert-info',
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="toast toast-top toast-end z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`alert ${ALERT_CLASS[t.type] ?? 'alert-info'} cursor-pointer shadow-lg`}
          onClick={() => remove(t.id)}
        >
          <span className="text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
