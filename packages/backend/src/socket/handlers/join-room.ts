import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';
import { prisma } from '../../config/database';
import { ROOM_MAX_USERS } from '@booth2gether/shared';
import { SocketManager } from '../socket-manager';
import type { Server } from 'socket.io';

type BoothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type BoothServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerJoinRoomHandler(
  socket: BoothSocket,
  manager: SocketManager,
  io: BoothServer,
): void {
  socket.on('join-room', async (payload) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: payload.roomCode.toUpperCase() },
        include: { users: true },
      });

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.state === 'CLOSED') {
        socket.emit('error', { message: 'Room is closed' });
        return;
      }

      const user = room.users.find((u) => u.id === payload.userId);
      if (!user) {
        socket.emit('error', { message: 'User not found in this room' });
        return;
      }

      await socket.join(room.code);

      let newState = room.state;
      if (room.users.length === ROOM_MAX_USERS) {
        const updated = await prisma.room.update({
          where: { id: room.id },
          data: { state: 'JOINED' },
        });
        newState = updated.state;
      }

      manager.addUserToRoom(
        room.code,
        room.id,
        user.id,
        socket.id,
        user.name,
        user.role,
        newState,
      );

      socket.emit('room-joined', {
        room: {
          id: room.id,
          code: room.code,
          hostId: room.hostId,
          state: newState as any,
          stripUrl: room.stripUrl,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
        users: room.users.map((u) => ({
          id: u.id,
          name: u.name,
          roomId: u.roomId,
          role: u.role as any,
          isReady: u.isReady,
          isConnected: u.isConnected,
          createdAt: u.createdAt.toISOString(),
        })),
      });     //fix 
      

      socket.to(room.code).emit('user-joined', {
        user: {
          id: user.id,
          name: user.name,
          roomId: user.roomId,
          role: user.role as any,
          isReady: user.isReady,
          isConnected: user.isConnected,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('join-room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
}

export function registerLeaveRoomHandler(
  socket: BoothSocket,
  manager: SocketManager,
  io: BoothServer,
): void {
  socket.on('leave-room', async (payload) => {
    try {
      const mapping = manager.getSocketUser(socket.id);
      if (!mapping) return;

      const { userId, roomCode } = mapping;

      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      manager.removeUserById(roomCode, userId);

      await socket.leave(roomCode);
      socket.to(roomCode).emit('user-left', { userId });

      const remaining = manager.getRoomUsers(roomCode);
      if (remaining.length === 0) {
        await prisma.room.updateMany({
          where: { code: roomCode },
          data: { state: 'CLOSED', endedAt: new Date() },
        });

        io.to(roomCode).emit('room-closed', { reason: 'All users left' });
      }
    } catch (error) {
      console.error('leave-room error:', error);
    }
  });
}
