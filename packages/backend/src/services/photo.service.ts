import { prisma } from '../config/database';
import { savePhoto } from '../config/storage';
import { generatePhotoStrip } from './strip-generator';
import type { Photo, User } from '@booth2gether/shared';

export class PhotoService {
  async uploadPhoto(
    file: Express.Multer.File,
    roomCode: string,
    userId: string,
    shotIndex: number,
  ): Promise<Photo> {
    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
    });
    if (!room) throw new PhotoUploadError('Room not found', 404);

    const user = await prisma.user.findFirst({
      where: { id: userId, roomId: room.id },
    });
    if (!user) throw new PhotoUploadError('User not found in this room', 403);

    if (shotIndex < 0 || shotIndex > 3) {
      throw new PhotoUploadError('Invalid shot index', 400);
    }

    const imageUrl = await savePhoto(file.buffer, room.id, userId, shotIndex);

    const photo = await prisma.photo.upsert({
      where: {
        roomId_userId_shotIndex: {
          roomId: room.id,
          userId,
          shotIndex,
        },
      },
      update: { imageUrl },
      create: {
        roomId: room.id,
        userId,
        imageUrl,
        shotIndex,
        order: shotIndex,
      },
    });

    return this.formatPhoto(photo);
  }

  async getRoomPhotos(roomCode: string): Promise<Photo[]> {
    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
    });
    if (!room) throw new PhotoUploadError('Room not found', 404);

    const photos = await prisma.photo.findMany({
      where: { roomId: room.id },
      orderBy: [{ userId: 'asc' }, { shotIndex: 'asc' }],
    });

    return photos.map((p) => this.formatPhoto(p));
  }

  async generateStrip(roomCode: string): Promise<string> {
    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
      include: { users: true, photos: true },
    });
    if (!room) throw new PhotoUploadError('Room not found', 404);

    if (room.photos.length < 8) {
      throw new PhotoUploadError('Not all photos uploaded yet', 400);
    }

    const host = room.users.find((u) => u.role === 'HOST');
    const guest = room.users.find((u) => u.role === 'GUEST');

    if (!host || !guest) {
      throw new PhotoUploadError('Both users must be in the room', 400);
    }

    const hostPhotos = room.photos
      .filter((p) => p.userId === host.id)
      .sort((a, b) => a.shotIndex - b.shotIndex)
      .map((p) => ({
        url: p.imageUrl,
        userId: p.userId,
        shotIndex: p.shotIndex,
      }));

    const guestPhotos = room.photos
      .filter((p) => p.userId === guest.id)
      .sort((a, b) => a.shotIndex - b.shotIndex)
      .map((p) => ({
        url: p.imageUrl,
        userId: p.userId,
        shotIndex: p.shotIndex,
      }));

    const stripUrl = await generatePhotoStrip({
      roomId: room.id,
      hostName: host.name,
      guestName: guest.name,
      hostPhotos,
      guestPhotos,
    });

    await prisma.room.update({
      where: { id: room.id },
      data: {
        stripUrl,
        state: 'COMPLETED',
      },
    });

    return stripUrl;
  }

  async getResult(roomCode: string): Promise<{
    room: any;
    photos: Photo[];
    stripUrl: string | null;
    host: User | null;
    guest: User | null;
  }> {
    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
      include: { users: true, photos: true },
    });
    if (!room) throw new PhotoUploadError('Room not found', 404);

    const host = room.users.find((u) => u.role === 'HOST');
    const guest = room.users.find((u) => u.role === 'GUEST');

    return {
      room: {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        state: room.state,
        stripUrl: room.stripUrl,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
      },
      photos: room.photos
        .sort((a, b) => a.shotIndex - b.shotIndex)
        .map((p) => this.formatPhoto(p)),
      stripUrl: room.stripUrl,
      host: host ? this.formatUser(host) : null,
      guest: guest ? this.formatUser(guest) : null,
    };
  }

  private formatPhoto(photo: any): Photo {
    return {
      id: photo.id,
      roomId: photo.roomId,
      userId: photo.userId,
      imageUrl: photo.imageUrl,
      shotIndex: photo.shotIndex,
      order: photo.order,
      createdAt: photo.createdAt.toISOString(),
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

export class PhotoUploadError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
