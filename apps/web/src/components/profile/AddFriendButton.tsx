'use client';

import { useState } from 'react';
import { FaUserPlus, FaUserCheck } from 'react-icons/fa';
import type { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { toast } from '@/store/toast.store';

interface Props {
  userId: string;
  username: string;
}

export function AddFriendButton({ userId, username }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  // O'z profili — tugma ko'rsatilmaydi
  if (!currentUser || currentUser.username === username) return null;

  const handleClick = async () => {
    setStatus('loading');
    try {
      await apiClient.post('/api/users/friends', { userId });
      setStatus('sent');
      toast.success("Do'stlik so'rovi yuborildi ✓");
    } catch (err) {
      const code = (err as AxiosError).response?.status;
      if (code === 409) {
        setStatus('sent');
        toast.info("So'rov allaqachon yuborilgan yoki do'stingiz");
      } else if (code === 404) {
        setStatus('idle');
        toast.error('Foydalanuvchi topilmadi');
      } else {
        setStatus('idle');
        toast.error('Xato yuz berdi, qaytadan urinib ko\'ring');
      }
    }
  };

  if (status === 'sent') {
    return (
      <div className="badge badge-success gap-1">
        <FaUserCheck size={12} />
        Do&apos;stingiz
      </div>
    );
  }

  return (
    <button
      className="btn btn-sm btn-primary gap-1"
      disabled={status === 'loading'}
      onClick={() => void handleClick()}
    >
      {status === 'loading' ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <FaUserPlus size={14} />
      )}
      Do&apos;st qo&apos;shish
    </button>
  );
}
