import type { AppSocket } from '../io';
import { ok, fail } from '@/modules/muzik/shared/http/response';
import { describeError } from '@/modules/muzik/shared/errors';
import { logger } from '@/modules/muzik/lib/logger';
import { markOnline } from '@/modules/muzik/server/services/roomService';
import { toParticipantDto } from '@/modules/muzik/server/mappers';

const groupOf = (roomId: string) => `room:${roomId}`;

/**
 * Room membership + presence. On join the socket enters the `room:{roomId}`
 * group, the participant is marked online, and OTHERS are told they joined.
 */
export function registerRoomHandlers(socket: AppSocket): void {
  socket.on('room:join', async ({ roomId }, ack) => {
    try {
      await socket.join(groupOf(roomId));
      const sessionId = socket.data.sessionId;
      if (sessionId) {
        const participant = await markOnline(roomId, sessionId);
        if (participant) {
          // Tell everyone else in the room (the joiner already has themselves).
          socket.to(groupOf(roomId)).emit('presence:participantJoined', {
            roomId,
            participant: toParticipantDto(participant),
          });
        }
      }
      logger.info({ socketId: socket.id, sessionId, roomId }, 'room:join');
      ack(ok({ joined: true }));
    } catch (err) {
      const { code, message } = describeError(err);
      ack(fail(code, message));
    }
  });

  socket.on('room:leave', async ({ roomId }, ack) => {
    try {
      await socket.leave(groupOf(roomId));
      ack(ok({ left: true }));
    } catch (err) {
      const { code, message } = describeError(err);
      ack(fail(code, message));
    }
  });
}
