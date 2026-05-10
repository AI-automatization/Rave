import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@utils/storage';
import { SupportMessage } from '@api/support.api';

const ADMIN_URL: string = process.env.EXPO_PUBLIC_ADMIN_URL ?? '';
const SOCKET_BASE = ADMIN_URL.replace(/\/api\/v1\/?$/, '');

interface UseSupportSocketParams {
  convId: string | undefined;
  onMessage: (msg: SupportMessage) => void;
}

export function useSupportSocket({ convId, onMessage }: UseSupportSocketParams): { connected: boolean } {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!convId) return;

    let mounted = true;

    void (async () => {
      const token = await tokenStorage.getAccessToken();
      if (!mounted) return;

      const socket = io(`${SOCKET_BASE}/support`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (mounted) setConnected(true);
        socket.emit('support:join', convId);
      });

      socket.on('disconnect', () => {
        if (mounted) setConnected(false);
      });

      socket.on('support:message', (msg: SupportMessage) => {
        onMessage(msg);
      });

      if (__DEV__) {
        socket.on('connect_error', (err: Error) => {
          console.log('[SupportSocket]', err.message);
        });
      }
    })();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit('support:leave', convId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [convId]); // onMessage excluded intentionally — stable via useCallback in caller

  return { connected };
}
