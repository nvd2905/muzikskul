import { httpGet } from '@/modules/muzik/lib/http';
import type { QueueItemDto } from '@/modules/muzik/shared/types';

export const getQueue = (roomId: string) =>
  httpGet<{ queue: QueueItemDto[] }>(`/api/rooms/${roomId}/queue`);
