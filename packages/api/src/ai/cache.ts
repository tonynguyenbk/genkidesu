import { createHash } from 'crypto';
import { prisma, Prisma } from '@genki/db';
import { analyzeFoodImage, type VisionResult } from './vision.js';

type PrismaInstance = typeof prisma;

const CACHE_TTL_DAYS = 30;

// Hash the base64 payload (without the `data:image/...;base64,` prefix) so the
// same image always maps to the same cache entry regardless of MIME wrapper.
export function hashImageDataUrl(imageDataUrl: string): string {
  const base64 = imageDataUrl.includes(',') ? imageDataUrl.split(',').slice(1).join(',') : imageDataUrl;
  return createHash('sha256').update(base64).digest('hex');
}

export async function getCachedVisionResult(
  db: PrismaInstance,
  imageHash: string,
): Promise<VisionResult | null> {
  const cached = await db.aiCache.findUnique({ where: { imageHash } });
  if (!cached || cached.expiresAt < new Date()) return null;

  await db.aiCache.update({
    where: { imageHash },
    data: { hitCount: { increment: 1 } },
  });

  return cached.aiResult as unknown as VisionResult;
}

export async function setCachedVisionResult(
  db: PrismaInstance,
  imageHash: string,
  result: VisionResult,
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const aiResult = result as unknown as Prisma.InputJsonValue;

  await db.aiCache.upsert({
    where: { imageHash },
    create: { imageHash, aiResult, hitCount: 1, expiresAt },
    update: { aiResult, expiresAt },
  });
}

// Single entry point for `meal.scan` — checks ai_cache before calling Claude Vision.
export async function analyzeFoodImageCached(
  db: PrismaInstance,
  imageDataUrl: string,
): Promise<VisionResult> {
  const imageHash = hashImageDataUrl(imageDataUrl);

  const cached = await getCachedVisionResult(db, imageHash);
  if (cached) {
    console.log(`[AI] Cache hit (${imageHash.slice(0, 8)}...)`);
    return cached;
  }

  const result = await analyzeFoodImage(imageDataUrl);
  await setCachedVisionResult(db, imageHash, result);
  return result;
}
