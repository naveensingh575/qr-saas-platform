import Redis from 'ioredis';

// In-memory fallback cache for development/demo when external Redis is not connected
class MemoryCache {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && typeof duration === 'number') {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && typeof duration === 'number') {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const val = await this.get(key);
    const num = val ? parseInt(val, 10) + 1 : 1;
    await this.set(key, num.toString());
    return num;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async eval(...args: any[]): Promise<any> {
    // Basic sliding window mock for rate limiter
    const key = args[2];
    const val = await this.incr(key);
    return val;
  }
}

const memoryFallback = new MemoryCache();

let redisClient: Redis | MemoryCache;

if (process.env.REDIS_URL) {
  try {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2000,
    });
    redis.on('error', (err) => {
      console.warn('[Redis] Connection error, using memory fallback:', err.message);
    });
    redisClient = redis;
  } catch {
    redisClient = memoryFallback;
  }
} else {
  redisClient = memoryFallback;
}

export const redis = redisClient;
