import { httpGet } from '@/modules/muzik/lib/http';
import type { PlaybackSnapshotDto } from '@/modules/muzik/shared/types';

export const getPlayback = (roomId: string) =>
  httpGet<PlaybackSnapshotDto>(`/api/rooms/${roomId}/playback`);
