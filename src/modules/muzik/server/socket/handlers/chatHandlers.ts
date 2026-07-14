import type { AppSocket } from '../io';
import { ok, fail } from '@/modules/muzik/shared/http/response';
import { describeError } from '@/modules/muzik/shared/errors';
import { sendMessage } from '@/modules/muzik/server/services/chatService';

/**
 * Chat command (SPEC §7.11). The service validates, persists, and broadcasts
 * (via the Redis emitter), so the handler just binds identity from the socket
 * (NEVER the payload — REALTIME §3), invokes, and acks. The ack returns the
 * created message; clients dedupe it against the broadcast by message id.
 */
export function registerChatHandlers(socket: AppSocket): void {
  socket.on('chat:send', async ({ roomId, body }, ack) => {
    try {
      ack(ok(await sendMessage(roomId, socket.data.sessionId, body)));
    } catch (err) {
      const { code, message } = describeError(err);
      ack(fail(code, message));
    }
  });
}
