import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';
import { SocketManager } from '../socket-manager';

type BoothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerWebRTCHandler(socket: BoothSocket, manager: SocketManager): void {
  socket.on('webrtc-offer', (payload) => {
    const mapping = manager.getSocketUser(socket.id);
    if (!mapping) return;

    socket.to(payload.roomCode).emit('webrtc-offer', {
      offer: payload.offer,
      fromUserId: mapping.userId,
    });
  });

  socket.on('webrtc-answer', (payload) => {
    const mapping = manager.getSocketUser(socket.id);
    if (!mapping) return;

    socket.to(payload.roomCode).emit('webrtc-answer', {
      answer: payload.answer,
      fromUserId: mapping.userId,
    });
  });

  socket.on('webrtc-ice-candidate', (payload) => {
    const mapping = manager.getSocketUser(socket.id);
    if (!mapping) return;

    socket.to(payload.roomCode).emit('webrtc-ice-candidate', {
      candidate: payload.candidate,
      fromUserId: mapping.userId,
    });
  });
}
