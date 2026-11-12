'use client';

import { useToastStore, toast as storeToast } from '@/store/toast.store';

// This file used to be the shadcn `use-toast` reducer, paired with `@/components/ui/toaster` —
// a component that was never rendered anywhere in the tree (grep, 2026-08-01). So every
// `toast({...})` call in RoomContent, SettingsContent, SupportContent, InviteDialog and
// VideoPlayer dispatched into a store nobody was listening to and showed nothing at all. The app
// already has a working toast store + <Toaster /> mounted in Providers, so this is now a thin
// adapter onto that one rather than a second, dead implementation.
//
// The shape (`{ title, description, variant }`) is kept so the five call sites don't have to
// change; `description` is appended because the rendered toast is a single line.

interface ToastInput {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

function asText(node: React.ReactNode): string {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

export function toast({ title, description, variant }: ToastInput) {
  const message = [asText(title), asText(description)].filter(Boolean).join(' — ');
  if (!message) return;

  if (variant === 'destructive') {
    storeToast.error(message);
  } else {
    storeToast.success(message);
  }
}

export function useToast() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);
  return { toasts, toast, dismiss: remove };
}
