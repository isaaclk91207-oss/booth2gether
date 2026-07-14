import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';
import { prisma } from '../../config/database';
import { COUNTDOWN_DURATION, TOTAL_SHOTS } from '@booth2gether/shared';
import { SocketManager } from '../socket-manager';
import type { Server } from 'socket.io';

type BoothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type BoothServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerStartSessionHandler(
  socket: BoothSocket,
  manager: SocketManager,
  io: BoothServer,
): void {
  socket.on('start-session', async (payload) => {
    try {
      const mapping = manager.getSocketUser(socket.id);
      if (!mapping) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      const { roomCode } = mapping;

      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: { users: true },
      });

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const allReady = room.users.every((u) => u.isReady);
      if (!allReady) {
        socket.emit('error', { message: 'Not all users are ready' });
        return;
      }

      await prisma.room.update({
        where: { id: room.id },
        data: { state: 'SHOOTING' },
      });

      manager.updateRoomState(roomCode, 'SHOOTING');

      io.to(roomCode).emit('countdown-start', { countdownDuration: COUNTDOWN_DURATION });

      runServerCountdown(io, roomCode, manager);
    } catch (error) {
      console.error('start-session error:', error);
      socket.emit('error', { message: 'Failed to start session' });
    }
  });
}

export function registerCountdownStartHandler(
  socket: BoothSocket,
  manager: SocketManager,
  io: BoothServer,
): void {
  socket.on('countdown-start', async () => {
    try {
      const mapping = manager.getSocketUser(socket.id);
      if (!mapping) return;

      const { roomCode } = mapping;

      const room = manager.getRoom(roomCode);
      if (!room || room.state !== 'SHOOTING') return;

      io.to(roomCode).emit('countdown-start', { countdownDuration: COUNTDOWN_DURATION });

      runServerCountdown(io, roomCode, manager);
    } catch (error) {
      console.error('countdown-start error:', error);
    }
  });
}

let shotTimers = new Map<string, NodeJS.Timeout[]>();

function runServerCountdown(io: BoothServer, roomCode: string, manager: SocketManager): void {
  clearShotTimers(roomCode);

  const timers: NodeJS.Timeout[] = [];

  for (let i = COUNTDOWN_DURATION; i > 0; i--) {
    const tickTimer = setTimeout(() => {
      io.to(roomCode).emit('countdown-tick', { count: i });
    }, (COUNTDOWN_DURATION - i) * 1000);
    timers.push(tickTimer);
  }

  for (let shot = 0; shot < TOTAL_SHOTS; shot++) {
    const shotDelay = (COUNTDOWN_DURATION + shot * 2) * 1000;

    const shotTimer = setTimeout(() => {
      io.to(roomCode).emit('capture-trigger', {
        shotIndex: shot,
        timestamp: Date.now(),
      });
    }, shotDelay);
    timers.push(shotTimer);
  }

  shotTimers.set(roomCode, timers);
}

function clearShotTimers(roomCode: string): void {
  const timers = shotTimers.get(roomCode);
  if (timers) {
    timers.forEach((t) => clearTimeout(t));
    shotTimers.delete(roomCode);
  }
}

export { clearShotTimers };
