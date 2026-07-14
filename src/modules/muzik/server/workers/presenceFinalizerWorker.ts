import { getRedis } from '@/modules/muzik/lib/redis';
import { logger } from '@/modules/muzik/lib/logger';
import { isAppError } from '@/modules/muzik/shared/errors';
import {
  redisKeys,
  PARTICIPANT_GRACE_MS,
  PRESENCE_FINALIZE_TICK_MS,
  PRESENCE_FINALIZE_LOCK_TTL_S,
} from '@/modules/muzik/shared/constants';
import { findGraceExpiredDisconnects } from '@/modules/muzik/server/repositories/roomRepository';
import { leaveRoom } from '@/modules/muzik/server/services/roomService';
import { emitToRoom } from '@/modules/muzik/server/realtime/emitter';

/**
 * Presence finalizer. A socket drop (browser close / network loss) marks the
 * participant offline but keeps them for a grace window (REALTIME: disconnect ≠
 * leave) so a refresh or blip doesn't kick them. This worker finalizes anyone who
 * stays disconnected past `PARTICIPANT_GRACE_MS` as a real LEAVE — it removes them
 * (host transfers / room goes idle, via `leaveRoom`) and broadcasts
 * `presence:participantLeft`, so every client removes them from the Participants
 * list and shows a "left" chip in chat (same handling as an explicit leave).
 *
 * A reconnect clears `disconnectedAt`, so a returning user is never finalized.
 * One instance acts per tick (Redis `SET NX` lock; same pattern as the reapers).
 */
export function startPresenceFinalizerWorker(): () => void {
  const timer = setInterval(() => {
    void tick();
  }, PRESENCE_FINALIZE_TICK_MS);
  logger.info('presence finalizer worker started');
  return () => clearInterval(timer);
}

async function tick(): Promise<void> {
  const lockKey = redisKeys.presenceFinalizeLock();
  let locked = false;
  try {
    const acquired = await getRedis().set(lockKey, '1', 'EX', PRESENCE_FINALIZE_LOCK_TTL_S, 'NX');
    if (acquired !== 'OK') return; // another instance is finalizing this tick
    locked = true;

    const cutoff = new Date(Date.now() - PARTICIPANT_GRACE_MS);
    const stale = await findGraceExpiredDisconnects(cutoff);
    if (stale.length === 0) return;

    for (const { roomId, sessionId } of stale) {
      try {
        const result = await leaveRoom(roomId, sessionId);
        emitToRoom(roomId, 'presence:participantLeft', { roomId, sessionId });
        if (result.hostChanged && result.newHostSessionId) {
          emitToRoom(roomId, 'presence:hostChanged', {
            roomId,
            newHostSessionId: result.newHostSessionId,
          });
        }
      } catch (err) {
        // PARTICIPANT_NOT_FOUND (already gone / rejoined mid-tick) is expected — ignore.
        if (!isAppError(err)) logger.error({ err, roomId, sessionId }, 'presence finalize failed');
      }
    }
    logger.info({ finalized: stale.length }, 'finalized grace-expired disconnects');
  } catch (err) {
    logger.error({ err }, 'presence finalizer tick failed');
  } finally {
    if (locked) await getRedis().del(lockKey); // release so the next tick can act
  }
}
