import type { Room, User } from './room';

// ─── Client → Server Events ─────────────────────────────────────────────────

export interface ClientToServerEvents {
  'join-room': (payload: { roomCode: string; userId: string }) => void;
  'leave-room': (payload: { roomCode: string }) => void;
  'ready': (payload: { roomCode: string; isReady: boolean }) => void;
  'start-session': (payload: { roomCode: string }) => void;
  'countdown-start': (payload: { roomCode: string }) => void;
  'capture': (payload: { roomCode: string; shotIndex: number }) => void;
  'webrtc-offer': (payload: { roomCode: string; offer: unknown }) => void;
  'webrtc-answer': (payload: { roomCode: string; answer: unknown }) => void;
  'webrtc-ice-candidate': (payload: { roomCode: string; candidate: unknown }) => void;
}

// ─── Server → Client Events ─────────────────────────────────────────────────

export interface ServerToClientEvents {
  'room-joined': (payload: { room: Room; users: User[] }) => void;
  'user-joined': (payload: { user: User }) => void;
  'user-left': (payload: { userId: string }) => void;
  'ready-updated': (payload: { userId: string; isReady: boolean }) => void;
  'countdown-start': (payload: { countdownDuration: number }) => void;
  'countdown-tick': (payload: { count: number }) => void;
  'capture-trigger': (payload: { shotIndex: number; timestamp: number }) => void;
  'photos-progress': (payload: { uploaded: number; total: number }) => void;
  'processing-started': (payload: Record<string, never>) => void;
  'strip-ready': (payload: { stripUrl: string }) => void;
  'room-closed': (payload: { reason: string }) => void;
  'user-disconnected': (payload: { userId: string; timeoutSeconds: number }) => void;
  'user-reconnected': (payload: { userId: string }) => void;
  'webrtc-offer': (payload: { offer: unknown; fromUserId: string }) => void;
  'webrtc-answer': (payload: { answer: unknown; fromUserId: string }) => void;
  'webrtc-ice-candidate': (payload: { candidate: unknown; fromUserId: string }) => void;
  'error': (payload: { message: string }) => void;
}
