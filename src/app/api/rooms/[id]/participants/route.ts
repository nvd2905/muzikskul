import type { NextRequest } from 'next/server';
import { roomIdSchema } from '@/modules/muzik/shared/validation';
import { handleRouteError, jsonOk } from '@/modules/muzik/lib/api';
import { getRoom, listParticipants } from '@/modules/muzik/server/services/roomService';
import { toParticipantDto } from '@/modules/muzik/server/mappers';

export const dynamic = 'force-dynamic';

/** GET /api/rooms/:id/participants — the participant list. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = roomIdSchema.parse(id);
    await getRoom(roomId); // 404 if unknown
    const participants = await listParticipants(roomId);
    return jsonOk({ participants: participants.map(toParticipantDto) });
  } catch (err) {
    return handleRouteError(err);
  }
}
