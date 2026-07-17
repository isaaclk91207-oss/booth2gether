'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/stores/room-store';

export function useRoomSocket(roomCode: string) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const setRoom = useRoomStore((s) => s.setRoom);
  const setUsers = useRoomStore((s) => s.setUsers);
  const addUser = useRoomStore((s) => s.addUser);
  const removeUser = useRoomStore((s) => s.removeUser);
  const updateReadyStatus = useRoomStore((s) => s.updateReadyStatus);

  const emitJoin = useCallback(
    (userId: string) => {
      const socket = getSocket();
      socket.emit('join-room', { roomCode, userId });
    },
    [roomCode],
  );

  const emitReady = useCallback(
    (isReady: boolean) => {
      const socket = getSocket();
      socket.emit('ready', { roomCode, isReady });
    },
    [roomCode],
  );

  const emitStartSession = useCallback(() => {
    const socket = getSocket();
    socket.emit('start-session', { roomCode });
  }, [roomCode]);

  const emitLeave = useCallback(() => {
    const socket = getSocket();
    socket.emit('leave-room', { roomCode });
  }, [roomCode]);

  const emitCapture = useCallback(
    (shotIndex: number) => {
      const socket = getSocket();
      socket.emit('capture', { roomCode, shotIndex });
    },
    [roomCode],
  );

  useEffect(() => {
    const socket = getSocket();

    function onRoomJoined(payload: { room: any; users: any[] }) {
      setRoom(payload.room);
      setUsers(payload.users);
    }

    function onUserJoined(payload: { user: any }) {
      addUser(payload.user);
    }

    function onUserLeft(payload: { userId: string }) {
      removeUser(payload.userId);
    }

    function onReadyUpdated(payload: { userId: string; isReady: boolean }) {
      updateReadyStatus(payload.userId, payload.isReady);
    }

    function onCountdownStart() {
      routerRef.current.push(`/room/${roomCode}/capture`);
    }

    function onRoomClosed() {
      routerRef.current.push('/');
    }

    function onError(payload: { message: string }) {
      console.error('Socket error:', payload.message);
    }

    socket.on('room-joined', onRoomJoined);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('ready-updated', onReadyUpdated);
    socket.on('countdown-start', onCountdownStart);
    socket.on('room-closed', onRoomClosed);
    socket.on('error', onError);

    return () => {
      socket.off('room-joined', onRoomJoined);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('ready-updated', onReadyUpdated);
      socket.off('countdown-start', onCountdownStart);
      socket.off('room-closed', onRoomClosed);
      socket.off('error', onError);
    };
  }, [roomCode, setRoom, setUsers, addUser, removeUser, updateReadyStatus]);

  return {
    emitJoin,
    emitReady,
    emitStartSession,
    emitLeave,
    emitCapture,
  };
}
