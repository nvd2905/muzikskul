import type { ServerToClientEvents } from '@/modules/muzik/shared/events';
import { getIO } from '@/modules/muzik/server/socket/io';

/**
 * Broadcast to a socket room from anywhere in the process — including Next REST
 * route handlers, which run in a SEPARATE module graph from the custom server.
 *
 * Upstream this bridged the two graphs via a Redis emitter. In this single-process
 * port the Socket.IO server instance is published on `globalThis` (shared across
 * every module graph in one Node process), so we can reach it directly without
 * Redis. `getIO()` returns null before the server boots (e.g. during `next build`),
 * in which case the broadcast is a harmless no-op.
 */
export const roomChannel = (roomId: string): string => `room:${roomId}`;

export function emitToRoom<E extends keyof ServerToClientEvents>(
  roomId: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  const io = getIO();
  if (!io) return;
  io.to(roomChannel(roomId)).emit(event, ...args);
}
