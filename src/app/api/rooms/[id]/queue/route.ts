import type { NextRequest } from 'next/server';
import { roomIdSchema } from '@/modules/muzik/shared/validation';
import { handleRouteError, jsonOk } from '@/modules/muzik/lib/api';
import { getRoom } from '@/modules/muzik/server/services/roomService';
import { getQueue } from '@/modules/muzik/server/services/queueService';

export const dynamic = 'force-dynamic';

/** GET /api/rooms/:id/queue — ordered queue snapshot (join-in-progress). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = roomIdSchema.parse(id);
    await getRoom(roomId); // 404 if unknown
    return jsonOk({ queue: await getQueue(roomId) });
  } catch (err) {
    return handleRouteError(err);
  }
}
