'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const s = await getSocket();
        if (!mounted) return;
        socketRef.current = s;

        s.on('connect', () => {
          if (mounted) setIsConnected(true);
        });

        s.on('disconnect', () => {
          if (mounted) setIsConnected(false);
        });

        if (s.connected) setIsConnected(true);
      } catch {
        // auth failed
      }
    }

    connect();

    return () => {
      mounted = false;
      disconnectSocket();
      setIsConnected(false);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
