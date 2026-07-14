import { logger } from './logger';

/**
 * In-memory Redis replacement (single-instance port into muzikskul).
 *
 * The upstream MMMuzik-v2 used Redis for the Socket.IO adapter/emitter, caches,
 * fixed-window rate limits and distributed locks. This port runs one Node process
 * (custom server hosts Next + Socket.IO + workers), so cross-instance coordination
 * isn't needed — an in-process store is correct and dependency-free. The shim
 * implements only the command subset the codebase uses, with the same signatures,
 * so no call site changes. Re-introduce real Redis here if you ever scale out.
 */
type Entry = { value: string; expireAt: number | null };

const globalForRedis = globalThis as unknown as { __muzikRedisStore?: Map<string, Entry> };
const store: Map<string, Entry> = (globalForRedis.__muzikRedisStore ??= new Map());

function live(key: string): Entry | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (e.expireAt !== null && e.expireAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return e;
}

class MemoryRedis {
  async get(key: string): Promise<string | null> {
    return live(key)?.value ?? null;
  }

  async set(
    key: string,
    value: string | number,
    ...args: Array<string | number>
  ): Promise<'OK' | null> {
    let expireAt: number | null = null;
    let nx = false;
    let xx = false;
    let keepTtl = false;
    for (let i = 0; i < args.length; i++) {
      const flag = String(args[i]).toUpperCase();
      if (flag === 'EX') expireAt = Date.now() + Number(args[++i]) * 1000;
      else if (flag === 'PX') expireAt = Date.now() + Number(args[++i]);
      else if (flag === 'NX') nx = true;
      else if (flag === 'XX') xx = true;
      else if (flag === 'KEEPTTL') keepTtl = true;
    }
    const existing = live(key);
    if (nx && existing) return null;
    if (xx && !existing) return null;
    if (keepTtl && existing) expireAt = existing.expireAt;
    store.set(key, { value: String(value), expireAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys) if (store.delete(k)) n++;
    return n;
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  async incrby(key: string, delta: number): Promise<number> {
    const e = live(key);
    const next = (e ? Number(e.value) : 0) + delta;
    store.set(key, { value: String(next), expireAt: e ? e.expireAt : null });
    return next;
  }

  async pexpire(key: string, ms: number): Promise<number> {
    const e = live(key);
    if (!e) return 0;
    e.expireAt = Date.now() + ms;
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.pexpire(key, seconds * 1000);
  }

  async pttl(key: string): Promise<number> {
    const e = live(key);
    if (!e) return -2;
    if (e.expireAt === null) return -1;
    return Math.max(0, e.expireAt - Date.now());
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  duplicate(): this {
    return this;
  }
}

const globalForClient = globalThis as unknown as { __muzikRedis?: MemoryRedis };

export function getRedis(): MemoryRedis {
  if (!globalForClient.__muzikRedis) {
    globalForClient.__muzikRedis = new MemoryRedis();
    logger.info('using in-memory redis shim (single-instance)');
  }
  return globalForClient.__muzikRedis;
}

/** Liveness check used by the health endpoint. In-memory store is always ready. */
export async function checkRedis(): Promise<boolean> {
  return true;
}
