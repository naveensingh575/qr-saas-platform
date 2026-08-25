import { redis } from './redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Sliding Window Redis Rate Limiter for x-api-key authentication
 * Default: 60 requests per 60 seconds (Free/Paid), 600 req/min (Business)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const currentBucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const redisKey = `ratelimit:${identifier}:${currentBucket}`;

  try {
    const currentCountStr = await redis.get(redisKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    if (currentCount >= limit) {
      const resetSeconds = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
      return {
        success: false,
        limit,
        remaining: 0,
        resetSeconds,
      };
    }

    const newCount = await redis.incr(redisKey);
    if (newCount === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    const resetSeconds = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - newCount),
      resetSeconds,
    };
  } catch (error) {
    console.warn('[RateLimiter] Error evaluating rate limit, passing request:', error);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }
}
