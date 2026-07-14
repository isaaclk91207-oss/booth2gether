import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';

export type BoothSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: BoothSocket | null = null;

export function getSocket(): BoothSocket {
  if (!socket) {
    socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocketId(): string | undefined {
  return socket?.id;
}
