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
});

initializeSocketHandlers(io);

function startServer() {
  const port = env.PORT;
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export { startServer };
