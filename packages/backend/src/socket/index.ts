import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';
import { SocketManager } from './socket-manager';
import {
  registerJoinRoomHandler,
  registerLeaveRoomHandler,
  registerReadyHandler,
  registerStartSessionHandler,
  registerCountdownStartHandler,
  registerCaptureHandler,
  registerWebRTCHandler,
} from './handlers';

type BoothServer = Server<ClientToServerEvents, ServerToClientEvents>;
type BoothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function initializeSocketHandlers(io: BoothServer): void {
  const manager = new SocketManager(io);

  io.on('connection', (socket: BoothSocket) => {
    console.log(`Client connected: ${socket.id}`);

    registerJoinRoomHandler(socket, manager, io);
    registerLeaveRoomHandler(socket, manager, io);
    registerReadyHandler(socket, manager);
    registerStartSessionHandler(socket, manager, io);
    registerCountdownStartHandler(socket, manager, io);
    registerCaptureHandler(socket, manager, io);
    registerWebRTCHandler(socket, manager);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      manager.handleDisconnect(socket.id);
    });
  });
}
