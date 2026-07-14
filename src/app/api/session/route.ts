import { handleRouteError, jsonOk } from '@/modules/muzik/lib/api';
import { readSessionCookie } from '@/modules/muzik/lib/cookies';
import { getValidSession } from '@/modules/muzik/server/services/sessionService';
import { toSessionDto } from '@/modules/muzik/server/mappers';

export const dynamic = 'force-dynamic';

/** GET /api/session — the caller's current guest session (from cookie), or null. */
export async function GET() {
  try {
    const session = await getValidSession(await readSessionCookie());
    return jsonOk({ session: session ? toSessionDto(session) : null });
  } catch (err) {
    return handleRouteError(err);
  }
}
