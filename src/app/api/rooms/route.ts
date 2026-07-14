import type { NextRequest } from 'next/server';
import { createRoomSchema } from '@/modules/muzik/shared/validation';
import { handleRouteError, jsonOk } from '@/modules/muzik/lib/api';
import { readSessionCookie, writeSessionCookie } from '@/modules/muzik/lib/cookies';
import { resolveOrCreateSession } from '@/modules/muzik/server/services/sessionService';
import { createRoom } from '@/modules/muzik/server/services/roomService';
import { toRoomDto, toParticipantDto, toSessionDto } from '@/modules/muzik/server/mappers';

export const dynamic = 'force-dynamic';

/** POST /api/rooms — create a room; caller becomes HOST. */
export async function POST(req: NextRequest) {
  try {
    const body = createRoomSchema.parse(await req.json().catch(() => ({})));
    const cookie = await readSessionCookie();
    const { session } = await resolveOrCreateSession(cookie, {
      displayName: body.nickname,
      avatar: body.avatar ?? null,
    });
    const { room, participant } = await createRoom(
      {
        name: body.name,
        nickname: body.nickname,
        avatar: body.avatar ?? null,
        visibility: body.visibility,
      },
      session.id,
    );
    await writeSessionCookie(session.id);
    return jsonOk(
      {
        room: toRoomDto(room),
        participant: toParticipantDto(participant),
        session: toSessionDto(session),
      },
      201,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
