import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { initializeSocketHandlers } from './socket';
import type { ClientToServerEvents, ServerToClientEvents } from '@booth2gether/shared';

const httpServer = createServer(app);

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initializeSocketHandlers(io);

function startServer() {
  const port = env.PORT;
  httpServer.listen(port, () => {
    console.log(`[${env.NODE_ENV}] Server running on http://localhost:${port}`);
  });
}

function gracefulShutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

export { startServer };
