import Redis from "ioredis";

type RedisCache = {
  client: Redis | null;
  isAvailable: boolean;
  warnedOnce: boolean;
};

const globalWithRedis = globalThis as typeof globalThis & {
  __steamCafeRedis?: RedisCache;
};

const cached: RedisCache = globalWithRedis.__steamCafeRedis ?? {
  client: null,
  isAvailable: false,
  warnedOnce: false
};

globalWithRedis.__steamCafeRedis = cached;

/**
 * Get or initialize the singleton Redis client.
 * Features automatic reconnect, short request timeout, and graceful degradation
 * so the application functions normally even if Redis is stopped.
 */
export function getRedisClient(): Redis | null {
  if (cached.client) {
    return cached.client;
  }

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          // Do not retry indefinitely if Redis is down
          return null;
        }
        return Math.min(times * 200, 1000);
      }
    });

    client.on("connect", () => {
      cached.isAvailable = true;
      console.log("[Redis] Connected successfully to Redis server.");
    });

    client.on("ready", () => {
      cached.isAvailable = true;
    });

    client.on("error", (err) => {
      cached.isAvailable = false;
      if (!cached.warnedOnce) {
        console.warn(`[Redis] Connection warning: ${err.message}. Operating with in-memory/direct DB fallback.`);
        cached.warnedOnce = true;
      }
    });

    client.on("close", () => {
      cached.isAvailable = false;
    });

    // Attempt connecting asynchronously without blocking initialization
    client.connect().catch((err) => {
      cached.isAvailable = false;
      if (!cached.warnedOnce) {
        console.warn(`[Redis] Initial connection attempt skipped: ${err.message}. Direct DB fallback enabled.`);
        cached.warnedOnce = true;
      }
    });

    cached.client = client;
    return client;
  } catch (error) {
    if (!cached.warnedOnce) {
      console.warn("[Redis] Failed to initialize Redis client:", error);
      cached.warnedOnce = true;
    }
    return null;
  }
}

/**
 * Retrieve cached value by key.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) return null;

  try {
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Store a key-value pair in cache with expiration (default: 300 seconds = 5 minutes).
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) return false;

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await client.set(key, serialized, "EX", ttlSeconds);
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a specific key from cache.
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) return false;

  try {
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidate keys matching a pattern (e.g. "cache:products:*").
 * Uses SCAN to avoid blocking the Redis event loop.
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) return 0;

  try {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 50);
      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== "0");

    return deletedCount;
  } catch {
    return 0;
  }
}

/**
 * Cache-Aside Helper:
 * Fetches from cache if present; otherwise invokes fetchFn, caches result, and returns it.
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cachedVal = await getCache<T>(key);
  if (cachedVal !== null && cachedVal !== undefined) {
    return cachedVal;
  }

  const freshData = await fetchFn();
  if (freshData !== null && freshData !== undefined) {
    // Fire and forget caching so we do not block response
    setCache(key, freshData, ttlSeconds).catch(() => {});
  }

  return freshData;
}

/**
 * Acquire a distributed lock using Redis SET NX EX.
 * Returns true if lock was acquired, false if already locked.
 */
export async function acquireDistributedLock(
  lockKey: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) {
    // If Redis is unavailable, allow execution to proceed (graceful degradation)
    return true;
  }

  try {
    const result = await client.set(lockKey, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    return true;
  }
}

/**
 * Release a distributed lock.
 */
export async function releaseDistributedLock(lockKey: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) return true;

  try {
    await client.del(lockKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Simple atomic rate limiter using Redis INCR and EXPIRE.
 * Returns true if request is within rate limit.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 20,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const client = getRedisClient();
  if (!client || !cached.isAvailable) {
    // Allow if Redis is not running
    return { allowed: true, remaining: limit };
  }

  try {
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }

    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    return { allowed, remaining };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
