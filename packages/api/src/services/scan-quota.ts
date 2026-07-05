import { Redis } from 'ioredis';
import { localDateKey, localDayRange } from '../utils/day.js';

// Free-tier photo scan quota (spec: 3 ảnh/ngày). Pro/family are unlimited —
// until RevenueCat lands every account is on the free plan.
export const FREE_SCANS_PER_DAY = 3;

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});
redis.on('error', () => {});

// In-memory fallback for single-instance deployments without Redis.
const memoryCounts = new Map<string, { count: number; dayKey: string }>();

function quotaKey(userId: string): { redisKey: string; dayKey: string; ttlSeconds: number } {
  const now = new Date();
  const dayKey = localDateKey(now).toISOString().slice(0, 10);
  const { end } = localDayRange(now);
  const ttlSeconds = Math.max(60, Math.ceil((end.getTime() - now.getTime()) / 1000));
  return { redisKey: `scanquota:${userId}:${dayKey}`, dayKey, ttlSeconds };
}

async function incrementCount(userId: string): Promise<number> {
  const { redisKey, dayKey, ttlSeconds } = quotaKey(userId);
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, ttlSeconds);
    return count;
  } catch {
    const entry = memoryCounts.get(userId);
    const count = entry?.dayKey === dayKey ? entry.count + 1 : 1;
    memoryCounts.set(userId, { count, dayKey });
    return count;
  }
}

export async function getScansUsedToday(userId: string): Promise<number> {
  const { redisKey, dayKey } = quotaKey(userId);
  try {
    return Number((await redis.get(redisKey)) ?? 0);
  } catch {
    const entry = memoryCounts.get(userId);
    return entry?.dayKey === dayKey ? entry.count : 0;
  }
}

// Consumes one scan up-front and reports whether the request may proceed.
// Counting before the AI call keeps the quota abuse-proof; callers should
// refund mock/failed results via refundScan so users don't lose real credits.
export async function consumeScanQuota(
  userId: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const count = await incrementCount(userId);
  return { allowed: count <= FREE_SCANS_PER_DAY, used: Math.min(count, FREE_SCANS_PER_DAY), limit: FREE_SCANS_PER_DAY };
}

export async function refundScan(userId: string): Promise<void> {
  const { redisKey, dayKey } = quotaKey(userId);
  try {
    await redis.decr(redisKey);
  } catch {
    const entry = memoryCounts.get(userId);
    if (entry?.dayKey === dayKey && entry.count > 0) {
      memoryCounts.set(userId, { count: entry.count - 1, dayKey });
    }
  }
}
