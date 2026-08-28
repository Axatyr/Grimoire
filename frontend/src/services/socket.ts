import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  const token = localStorage.getItem('grimoire_token');
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Grimoire Realtime Engine');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
