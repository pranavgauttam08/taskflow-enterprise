import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../utils/api';

let socket = null;

export function useSocket(user) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : '/';

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user]);

  const on = useCallback((event, handler) => {
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    socket?.emit(event, data);
  }, []);

  return { socket: socketRef.current, on, emit };
}

export function getSocket() {
  return socket;
}
