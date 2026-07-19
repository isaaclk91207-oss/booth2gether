import type { Room, User, Photo } from '@booth2gether/shared';
import { ROOM_STATES } from '@booth2gether/shared';

export const mockHostUser: User = {
  id: 'user-host-001',
  name: 'Alice',
  roomId: 'room-001',
  role: 'HOST',
  isReady: true,
  isConnected: true,
  createdAt: new Date().toISOString(),
};

export const mockGuestUser: User = {
  id: 'user-guest-001',
  name: 'Bob',
  roomId: 'room-001',
  role: 'GUEST',
  isReady: false,
  isConnected: true,
  createdAt: new Date().toISOString(),
};

export const mockUsers: User[] = [mockHostUser, mockGuestUser];

export const mockRoom: Room = {
  id: 'room-001',
  code: 'XK7M9P',
  hostId: 'user-host-001',
  state: ROOM_STATES.WAITING,
  stripUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockRoomJoined: Room = {
  ...mockRoom,
  state: ROOM_STATES.JOINED,
};

export const mockRoomReady: Room = {
  ...mockRoom,
  state: ROOM_STATES.READY,
};

export const mockRoomShooting: Room = {
  ...mockRoom,
  state: ROOM_STATES.SHOOTING,
};

export const mockRoomProcessing: Room = {
  ...mockRoom,
  state: ROOM_STATES.PROCESSING,
};

export const mockRoomCompleted: Room = {
  ...mockRoom,
  state: ROOM_STATES.COMPLETED,
  stripUrl: 'https://placehold.co/400x800/000/fff?text=Photo+Strip',
};

export const mockPhotos: Photo[] = Array.from({ length: 8 }, (_, i) => ({
  id: `photo-${i + 1}`,
  roomId: 'room-001',
  userId: i % 2 === 0 ? 'user-host-001' : 'user-guest-001',
  imageUrl: `https://placehold.co/400x300/${i % 2 === 0 ? '3b82f6' : 'ef4444'}/fff?text=Photo+${i + 1}`,
  shotIndex: Math.floor(i / 2) + 1,
  order: i + 1,
  selected: true,
  createdAt: new Date().toISOString(),
}));

export const mockStripUrl = 'https://placehold.co/400x800/1a1a1a/fff?text=BoothTogether%0A12+Jul+2026';