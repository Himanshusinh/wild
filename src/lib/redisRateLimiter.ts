/**
 * Optional Redis-backed rate limiter. Tries to use `ioredis` at runtime if available
 * and `REDIS_URL` (or REDIS_HOST/PORT) env vars are provided. If Redis is not
 * available, exports will indicate `available: false` so callers can fallback.
 */

type RateResult = { ok: boolean; retryAfter?: number };

let available = false;
let redisClient: any = null;

async function initRedis(): Promise<void> {
  if (redisClient) return;
  try {
    // dynamic import to avoid hard dependency at build time
    // @ts-expect-error - ioredis is an optional dependency that may not be installed
    const IORedis = await import('ioredis');
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      redisClient = new IORedis.default(redisUrl);
    } else {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const opts: any = {};
      if (process.env.REDIS_PASSWORD) opts.password = process.env.REDIS_PASSWORD;
      redisClient = new IORedis.default(port, host, opts);
    }
    available = true;
  } catch (err) {
    // Not fatal — consumer should fallback to in-memory limiter
    available = false;
    redisClient = null;
    // don't log here to avoid noisy logs when module not installed
  }
}

export async function redisAvailable(): Promise<boolean> {
  await initRedis();
  return available && !!redisClient;
}

/**
 * Rate-limit a single key (e.g., IP) using Redis INCR with expiry.
 * windowSeconds: window duration in seconds
 * max: max allowed requests in window
 */
export async function limitKey(key: string, windowSeconds = 60, max = 30): Promise<RateResult> {
  await initRedis();
  if (!redisClient) return { ok: false };

  try {
    const redisKey = `rl:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    // Use a Lua script to atomically increment and set TTL when first created
    // but to keep things simple we will INCR and EXPIRE when necessary.
    const count = await redisClient.incr(redisKey);
    if (count === 1) {
      await redisClient.expire(redisKey, windowSeconds);
    }

    if (count > max) {
      // compute retryAfter from TTL
      const ttl = await redisClient.ttl(redisKey);
      const retryAfter = ttl > 0 ? ttl : windowSeconds;
      return { ok: false, retryAfter };
    }

    return { ok: true };
  } catch (err) {
    // If Redis fails, signal caller to fallback
    return { ok: false };
  }
}

export default { redisAvailable, limitKey };
