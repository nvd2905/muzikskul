import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '@/modules/muzik/shared/events';
import { config } from '@/modules/muzik/lib/config';
import { logger } from '@/modules/muzik/lib/logger';
import { registerRoomNamespace } from './namespace';

/** Strongly-typed Socket.IO server/socket for the app contract. */
export type AppServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

// Published on globalThis so REST route handlers (a separate Next module graph)
// can reach the same instance without Redis — see realtime/emitter.ts.
const globalForIO = globalThis as unknown as { __muzikIO?: AppServer };

/**
 * Create and configure the Socket.IO server attached to the custom HTTP server.
 * Single-instance: no Redis adapter (broadcasts stay in-process).
 */
export function createSocketServer(httpServer: HttpServer): AppServer {
  const io: AppServer = new SocketIOServer(httpServer, {
    cors: { origin: config.APP_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  registerRoomNamespace(io);
  globalForIO.__muzikIO = io;

  logger.info('Socket.IO initialized (in-process, no adapter)');
  return io;
}

/** The running Socket.IO server, or null before the custom server has booted. */
export function getIO(): AppServer | null {
  return globalForIO.__muzikIO ?? null;
}
