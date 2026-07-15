import { prisma } from '../config/database';
import { ROOM_CODE_LENGTH, ROOM_CODE_CHARS, ROOM_MAX_USERS, ROOM_STATES, USER_ROLES } from '@booth2gether/shared';
import type { Room, User } from '@booth2gether/shared';

const ROOM_EXPIRY_MINUTES = 30;
const MAX_CODE_RETRIES = 10;

export class RoomService {
  async createRoom(hostName: string): Promise<{ room: Room; user: User }> {
    const code = await this.generateUniqueCode();

    const room = await prisma.room.create({
      data: {
        code,
        hostId: '',
        state: ROOM_STATES.WAITING,
        expiresAt: new Date(Date.now() + ROOM_EXPIRY_MINUTES * 60 * 1000),
        users: {
          create: {
            name: hostName,
            role: USER_ROLES.HOST,
          },
        },
      },
      include: { users: true },
    });

    const host = room.users[0];
    if (!host) {
      throw new RoomNotFoundError();
    }

    await prisma.room.update({
      where: { id: room.id },
      data: { hostId: host.id },
    });

    return {
      room: this.formatRoom(room),
      user: this.formatUser(host),
    };
  }

  async getRoom(code: string): Promise<{ room: Room; userCount: number }> {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: { users: true },
    });

    if (!room) {
      throw new RoomNotFoundError();
    }

    if (room.state === ROOM_STATES.CLOSED) {
      throw new RoomClosedError();
    }

    return {
      room: this.formatRoom(room),
      userCount: room.users.length,
    };
  }

  async joinRoom(code: string, guestName: string): Promise<{ room: Room; user: User; users: User[] }> {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: { users: true },
    });

    if (!room) {
      throw new RoomNotFoundError();
    }

    if (room.state === ROOM_STATES.CLOSED) {
      throw new RoomClosedError();
    }

    if (room.users.length >= ROOM_MAX_USERS) {
      const existingUser = room.users.find(
        (u) => u.name.toLowerCase() === guestName.toLowerCase()
      );
      if (existingUser) {
        return {
          room: this.formatRoom(room),
          user: this.formatUser(existingUser),
          users: room.users.map((u) => this.formatUser(u)),
        };
      }
      throw new RoomFullError();
    }

    const existingGuest = room.users.find(
      (u) => u.name.toLowerCase() === guestName.toLowerCase()
    );
    if (existingGuest) {
      return {
        room: this.formatRoom(room),
        user: this.formatUser(existingGuest),
        users: room.users.map((u) => this.formatUser(u)),
      };
    }

    const guest = await prisma.user.create({
      data: {
        name: guestName,
        roomId: room.id,
        role: USER_ROLES.GUEST,
      },
    });

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: { state: ROOM_STATES.JOINED },
      include: { users: true },
    });

    return {
      room: this.formatRoom(updatedRoom),
      user: this.formatUser(guest),
      users: updatedRoom.users.map((u) => this.formatUser(u)),
    };
  }

  async closeRoom(code: string): Promise<void> {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!room) {
      throw new RoomNotFoundError();
    }

    await prisma.room.update({
      where: { id: room.id },
      data: {
        state: ROOM_STATES.CLOSED,
        endedAt: new Date(),
      },
    });
  }

  async cleanupExpiredRooms(): Promise<number> {
    const expiredRooms = await prisma.room.findMany({
      where: {
        expiresAt: { lt: new Date() },
        state: { not: ROOM_STATES.CLOSED },
      },
    });

    if (expiredRooms.length === 0) return 0;

    await prisma.room.updateMany({
      where: {
        id: { in: expiredRooms.map((r) => r.id) },
      },
      data: {
        state: ROOM_STATES.CLOSED,
        endedAt: new Date(),
      },
    });

    return expiredRooms.length;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const code = this.generateCode();
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) return code;
    }
    throw new Error('Failed to generate unique room code');
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
    }
    return code;
  }

  private formatRoom(room: any): Room {
    return {
      id: room.id,
      code: room.code,
      hostId: room.hostId,
      state: room.state,
      stripUrl: room.stripUrl,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  private formatUser(user: any): User {
    return {
      id: user.id,
      name: user.name,
      roomId: user.roomId,
      role: user.role,
      isReady: user.isReady,
      isConnected: user.isConnected,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export class RoomNotFoundError extends Error {
  statusCode = 404;
  code = 'ROOM_NOT_FOUND';
  constructor() {
    super('Room not found');
  }
}

export class RoomClosedError extends Error {
  statusCode = 410;
  code = 'ROOM_CLOSED';
  constructor() {
    super('Room has been closed');
  }
}

export class RoomFullError extends Error {
  statusCode = 409;
  code = 'ROOM_FULL';
  constructor() {
    super('Room is full');
  }
}

export class GuestNameTakenError extends Error {
  statusCode = 409;
  code = 'GUEST_NAME_TAKEN';
  constructor() {
    super('A user with this name is already in the room');
  }
}
