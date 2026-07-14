import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';
import { prisma } from '../../config/database';
import { TOTAL_SHOTS } from '@booth2gether/shared';
import { SocketManager } from '../socket-manager';
import { PhotoService } from '../../services/photo.service';
import type { Server } from 'socket.io';

type BoothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type BoothServer = Server<ClientToServerEvents, ServerToClientEvents>;

const photoService = new PhotoService();

export function registerCaptureHandler(
  socket: BoothSocket,
  manager: SocketManager,
  io: BoothServer,
): void {
  socket.on('capture', async (payload) => {
    try {
      const mapping = manager.getSocketUser(socket.id);
      if (!mapping) return;

      const { roomCode } = mapping;
      const room = manager.getRoom(roomCode);
      if (!room) return;

      const dbRoom = await prisma.room.findUnique({ where: { code: roomCode } });
      if (!dbRoom) return;

      const totalPhotos = TOTAL_SHOTS * 2;
      const uploadedCount = await prisma.photo.count({
        where: { roomId: dbRoom.id },
      });

      io.to(roomCode).emit('photos-progress', {
        uploaded: uploadedCount,
        total: totalPhotos,
      });

      if (uploadedCount >= totalPhotos) {
        await prisma.room.update({
          where: { id: dbRoom.id },
          data: { state: 'PROCESSING' },
        });

        manager.updateRoomState(roomCode, 'PROCESSING');
        io.to(roomCode).emit('processing-started', {});

        try {
          const stripUrl = await photoService.generateStrip(roomCode);

          await prisma.room.update({
            where: { id: dbRoom.id },
            data: { state: 'COMPLETED', stripUrl },
          });

          manager.updateRoomState(roomCode, 'COMPLETED');
          io.to(roomCode).emit('strip-ready', { stripUrl });
        } catch (genError) {
          console.error('strip generation error:', genError);
          io.to(roomCode).emit('error', { message: 'Failed to generate photo strip' });
        }
      }
    } catch (error) {
      console.error('capture progress error:', error);
    }
  });
}
