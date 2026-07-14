import { create } from 'zustand';
import type { Room, User } from '@booth2gether/shared';

export interface RoomStore {
  room: Room | null;
  users: User[];
  localUser: User | null;
  remoteUser: User | null;
  isConnected: boolean;
  countdown: number | null;
  currentShot: number;
  isSessionStarted: boolean;

  setRoom: (room: Room) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setLocalUser: (user: User) => void;
  updateReadyStatus: (userId: string, isReady: boolean) => void;
  setConnected: (connected: boolean) => void;
  setCountdown: (count: number | null) => void;
  setCurrentShot: (shot: number) => void;
  setSessionStarted: (started: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  users: [],
  localUser: null,
  remoteUser: null,
  isConnected: false,
  countdown: null,
  currentShot: 0,
  isSessionStarted: false,

  setRoom: (room) => set({ room }),

  setUsers: (users) => {
    const localUser = get().localUser;
    const remoteUser = localUser
      ? users.find((u) => u.id !== localUser.id) || null
      : null;
    set({ users, remoteUser });
  },

  addUser: (user) => {
    set((state) => {
      if (state.users.some((u) => u.id === user.id)) return state;
      const newUsers = [...state.users, user];
      const remoteUser = state.localUser && user.id !== state.localUser.id ? user : state.remoteUser;
      return { users: newUsers, remoteUser };
    });
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      remoteUser: state.remoteUser?.id === userId ? null : state.remoteUser,
    }));
  },

  setLocalUser: (user) => {
    set((state) => ({
      localUser: user,
      remoteUser: state.users.find((u) => u.id !== user.id) || null,
    }));
  },

  updateReadyStatus: (userId, isReady) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, isReady } : u,
      ),
      localUser: state.localUser?.id === userId ? { ...state.localUser, isReady } : state.localUser,
      remoteUser: state.remoteUser?.id === userId ? { ...state.remoteUser, isReady } : state.remoteUser,
    }));
  },

  setConnected: (connected) => set({ isConnected: connected }),

  setCountdown: (count) => set({ countdown: count }),

  setCurrentShot: (shot) => set({ currentShot: shot }),

  setSessionStarted: (started) => set({ isSessionStarted: started }),

  reset: () => set({
    room: null,
    users: [],
    localUser: null,
    remoteUser: null,
    isConnected: false,
    countdown: null,
    currentShot: 0,
    isSessionStarted: false,
  }),
}));
