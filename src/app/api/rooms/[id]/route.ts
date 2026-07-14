import type { NextRequest } from 'next/server';
import { roomIdSchema } from '@/modules/muzik/shared/validation';
import { handleRouteError, jsonOk } from '@/modules/muzik/lib/api';
import { getRoom, listParticipants } from '@/modules/muzik/server/services/roomService';
import { toRoomDto } from '@/modules/muzik/server/mappers';

export const dynamic = 'force-dynamic';

/** GET /api/rooms/:id — room details + participant count. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = roomIdSchema.parse(id);
    const room = await getRoom(roomId);
    const participants = await listParticipants(roomId);
    return jsonOk({ room: toRoomDto(room), participantCount: participants.length });
  } catch (err) {
    return handleRouteError(err);
  }
}
