import { ROOM_STATES, USER_ROLES } from '../constants';

export type RoomState = (typeof ROOM_STATES)[keyof typeof ROOM_STATES];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface Room {
  id: string;
  code: string;
  hostId: string | null;
  state: RoomState;
  stripUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  roomId: string;
  role: UserRole;
  isReady: boolean;
  isConnected: boolean;
  createdAt: string;
}

export interface Photo {
  id: string;
  roomId: string;
  userId: string;
  imageUrl: string;
  shotIndex: number;
  order: number;
  selected: boolean;
  createdAt: string;
}

export interface CreateRoomRequest {
  hostName: string;
}

export interface JoinRoomRequest {
  guestName: string;
}

export interface CreateRoomResponse {
  room: Room;
  user: User;
}

export interface JoinRoomResponse {
  room: Room;
  user: User;
  users: User[];
}

export interface RoomDetailResponse {
  room: Room;
  userCount: number;
}

export interface UploadPhotoResponse {
  photo: Photo;
}

export interface GetPhotosResponse {
  photos: Photo[];
}

export interface GenerateStripRequest {
  roomCode: string;
}

export interface GenerateStripResponse {
  stripUrl: string;
}

export interface GetResultResponse {
  room: Room;
  photos: Photo[];
  stripUrl: string | null;
  host: User | null;
  guest: User | null;
}

export interface ReorderPhotosRequest {
  roomCode: string;
  photos: Array<{ id: string; order: number; selected: boolean }>;
}

export interface ReorderPhotosResponse {
  stripUrl: string | null;
}
