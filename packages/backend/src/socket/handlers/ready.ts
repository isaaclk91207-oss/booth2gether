import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';
import { prisma } from '../../config/database';
import { SocketManager } from '../socket-manager';

type BoothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerReadyHandler(
  socket: BoothSocket,
  manager: SocketManager,
): void {
  socket.on('ready', async (payload) => {
    try {
      const mapping = manager.getSocketUser(socket.id);
      if (!mapping) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      const { userId, roomCode } = mapping;

      await prisma.user.update({
        where: { id: userId },
        data: { isReady: payload.isReady },
      });

      socket.to(roomCode).emit('ready-updated', {
        userId,
        isReady: payload.isReady,
      });
    } catch (error) {
      console.error('ready error:', error);
      socket.emit('error', { message: 'Failed to update ready status' });
    }
  });
}
