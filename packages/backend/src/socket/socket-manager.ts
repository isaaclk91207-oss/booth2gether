import { prisma } from '../config/database';
import { DISCONNECT_TIMEOUT_SECONDS } from '@booth2gether/shared';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';

export interface TrackedUser {
  userId: string;
  socketId: string;
  name: string;
  role: string;
}

export interface TrackedRoom {
  code: string;
  roomId: string;
  users: Map<string, TrackedUser>;
  state: string;
}

type BoothServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class SocketManager {
  private rooms = new Map<string, TrackedRoom>();
  private socketToRoom = new Map<string, string>();
  private socketToUser = new Map<string, { roomCode: string; userId: string }>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();
  private io: BoothServer;

  constructor(io: BoothServer) {
    this.io = io;
  }

  addUserToRoom(
    roomCode: string,
    roomId: string,
    userId: string,
    socketId: string,
    name: string,
    role: string,
    state: string,
  ): void {
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = { code: roomCode, roomId, users: new Map(), state };
      this.rooms.set(roomCode, room);
    }

    room.users.set(userId, { userId, socketId, name, role });
    room.state = state;
    this.socketToRoom.set(socketId, roomCode);
    this.socketToUser.set(socketId, { roomCode, userId });
  }

  removeUserBySocket(socketId: string): { roomCode: string; userId: string; user: TrackedUser } | null {
    const mapping = this.socketToUser.get(socketId);
    if (!mapping) return null;

    const { roomCode, userId } = mapping;
    const room = this.rooms.get(roomCode);
    const user = room?.users.get(userId);

    room?.users.delete(userId);
    this.socketToRoom.delete(socketId);
    this.socketToUser.delete(socketId);

    if (room && room.users.size === 0) {
      this.rooms.delete(roomCode);
    }

    return { roomCode, userId, user: user! };
  }

  removeUserById(roomCode: string, userId: string): TrackedUser | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const user = room.users.get(userId);
    if (!user) return null;

    this.socketToRoom.delete(user.socketId);
    this.socketToUser.delete(user.socketId);
    room.users.delete(userId);

    if (room.users.size === 0) {
      this.rooms.delete(roomCode);
    }

    return user;
  }

  getRoom(roomCode: string): TrackedRoom | undefined {
    return this.rooms.get(roomCode);
  }

  getRoomUsers(roomCode: string): TrackedUser[] {
    const room = this.rooms.get(roomCode);
    return room ? Array.from(room.users.values()) : [];
  }

  getSocketUser(socketId: string): { roomCode: string; userId: string } | undefined {
    return this.socketToUser.get(socketId);
  }

  getSocketByUserId(roomCode: string, userId: string): string | null {
    const room = this.rooms.get(roomCode);
    const user = room?.users.get(userId);
    return user?.socketId ?? null;
  }

  updateRoomState(roomCode: string, state: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.state = state;
  }

  startDisconnectTimer(
    socketId: string,
    userId: string,
    roomCode: string,
    callback: () => void,
  ): void {
    this.clearDisconnectTimer(socketId);
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(socketId);
      callback();
    }, DISCONNECT_TIMEOUT_SECONDS * 1000);
    this.disconnectTimers.set(socketId, timer);
  }

  clearDisconnectTimer(socketId: string): void {
    const timer = this.disconnectTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(socketId);
    }
  }

  hasDisconnectTimer(socketId: string): boolean {
    return this.disconnectTimers.has(socketId);
  }

  async handleDisconnect(socketId: string): Promise<void> {
    const mapping = this.socketToUser.get(socketId);
    if (!mapping) return;

    const { roomCode, userId } = mapping;

    await prisma.user.updateMany({
      where: { id: userId },
      data: { isConnected: false },
    });

    const room = this.rooms.get(roomCode);
    if (room) {
      for (const [, u] of room.users) {
        if (u.userId !== userId) {
          this.io.to(u.socketId).emit('user-disconnected', {
            userId,
            timeoutSeconds: DISCONNECT_TIMEOUT_SECONDS,
          });
        }
      }
    }

    this.startDisconnectTimer(socketId, userId, roomCode, async () => {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});

      this.removeUserById(roomCode, userId);

      this.io.to(roomCode).emit('user-left', { userId });

      const remaining = this.getRoomUsers(roomCode);
      if (remaining.length === 0) {
        await prisma.room.updateMany({
          where: { code: roomCode },
          data: { state: 'CLOSED', endedAt: new Date() },
        });

        this.io.to(roomCode).emit('room-closed', { reason: 'All users disconnected' });
      }
    });
  }

  async handleReconnect(socketId: string, roomCode: string, userId: string): Promise<boolean> {
    this.clearDisconnectTimer(socketId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.roomId !== this.rooms.get(roomCode)?.roomId) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isConnected: true },
    });

    const room = await prisma.room.findUnique({
      where: { code: roomCode },
      include: { users: true },
    });
    if (!room) return false;

    const tracked = this.rooms.get(roomCode);
    if (!tracked) return false;

    tracked.users.set(userId, {
      userId,
      socketId,
      name: user.name,
      role: user.role,
    });
    this.socketToRoom.set(socketId, roomCode);
    this.socketToUser.set(socketId, { roomCode, userId });

    const allUsers = tracked.users.size;
    const connectedUsers = Array.from(tracked.users.values()).length;

    for (const [, u] of tracked.users) {
      if (u.userId !== userId) {
        this.io.to(u.socketId).emit('user-reconnected', { userId });
      }
    }

    this.io.to(socketId).emit('room-joined', {
      room: {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        state: room.state as any,
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
    });

    return true;
  }
}
