'use client';

/**
 * WW v2 forma primitivlari — redesign fundamenti (T-S195).
 *
 * Nega alohida komponent: login/register/forgot/reset/settings — beshta joyda
 * bir xil `<label> + ikonka + input + xato matni` bloki qo'lda takrorlanardi.
 * Har biri o'z padding va rangi bilan biroz boshqacha edi. Bu yerda bitta
 * manba: ko'rinish `.ww-field` (globals.css) da, tuzilma shu faylda.
 *
 * A11y: `Field` id ni bolasiga avtomatik uzatadi, xato matnini
 * `aria-describedby` orqali bog'laydi va `aria-invalid` qo'yadi — ya'ni
 * chaqiruvchi kod hech narsani unutmaydi.
 */

import * as React from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ────────────────────────────── Field ────────────────────────────── */

interface FieldProps {
  label: React.ReactNode;
  /** O'ng tomondagi qo'shimcha (masalan "Parolni unutdingizmi?" havolasi) */
  action?: React.ReactNode;
  /** Xato matni — mavjud bo'lsa input avtomatik `aria-invalid` bo'ladi */
  error?: string;
  /** Xatosiz holatdagi izoh */
  hint?: string;
  children: React.ReactElement;
  className?: string;
}

export function Field({ label, action, error, hint, children, className }: FieldProps) {
  const reactId = React.useId();
  const childProps = children.props as { id?: string; 'aria-describedby'?: string };
  const id = childProps.id ?? reactId;
  const msgId = `${id}-msg`;
  const hasMsg = Boolean(error || hint);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[13px] font-medium leading-none text-[var(--ww-text-2)]"
        >
          {label}
        </label>
        {action}
      </div>

      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': hasMsg ? msgId : childProps['aria-describedby'],
      } as Partial<React.InputHTMLAttributes<HTMLInputElement>>)}

      {hasMsg && (
        <p
          id={msgId}
          /* role=alert faqat xatoda — izoh uchun ekran o'quvchini uzmaslik kerak */
          role={error ? 'alert' : undefined}
          className={cn(
            'text-[12.5px] leading-snug',
            error ? 'text-[var(--ww-danger)]' : 'text-[var(--ww-text-3)]',
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────── Input ────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Chapdagi ikonka (lucide komponenti) */
  icon?: LucideIcon;
  /** O'ngdagi element — masalan parolni ko'rsatish tugmasi */
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon: Icon, trailing, className, ...props }, ref) => (
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ww-text-4)]"
        />
      )}
      <input
        ref={ref}
        className={cn(
          'ww-field',
          Icon ? 'pl-10' : 'pl-4',
          trailing ? 'pr-11' : 'pr-4',
          className,
        )}
        {...props}
      />
      {trailing && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  ),
);
Input.displayName = 'Input';

/* ────────────────────────── PasswordInput ────────────────────────── */

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'trailing'> {
  /** Ko'z tugmasi uchun ekran o'quvchi yorlig'i (tarjima qilinadigan matn) */
  toggleLabel?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ toggleLabel = 'Parolni ko’rsatish', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={toggleLabel}
            aria-pressed={visible}
            /* 40px — ikonka 16px bo'lsa ham bosish maydoni katta bo'lishi
               kerak (WCAG 2.2 minimumi 24px, barmoq uchun qulay chegara 44px;
               48px maydon ichida 40px eng kattasi) */
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text-2)]"
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
