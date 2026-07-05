import { prisma } from '@genki/db';
import { embedText } from './embeddings.js';
import type { DetectedDish } from './vision.js';

type PrismaInstance = typeof prisma;

// Cosine similarity below this is treated as "no match" — AI's own estimate is kept.
// Tuned for gemini-embedding-001 @ 1536-dim: correct Vietnamese-dish matches land
// at ~0.78-0.92, unrelated dishes at ~0.70-0.74, so 0.75 captures true matches
// while rejecting noise. (OpenAI's text-embedding-3-small had a higher band → 0.8.)
const SIMILARITY_THRESHOLD = 0.75;

interface FoodMatch {
  id: string;
  nameVi: string;
  nameEn: string | null;
  calPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  micronutrientsPer100g: Record<string, number> | null;
  micronutrientsVerified: boolean;
  verified: boolean;
  similarity: number;
}

// Finds the closest verified food via pgvector cosine similarity on `foods.embedding`.
// Returns null if no embedding provider is configured or nothing clears the threshold.
export async function matchFoodForDish(
  db: PrismaInstance,
  dish: DetectedDish,
): Promise<FoodMatch | null> {
  const embedding = await embedText(`${dish.nameVi} ${dish.nameEn ?? ''}`.trim());
  if (embedding.every((v) => v === 0)) return null;

  const vectorLiteral = `[${embedding.join(',')}]`;

  const rows = await db.$queryRaw<FoodMatch[]>`
    SELECT id, name_vi AS "nameVi", name_en AS "nameEn",
           cal_per_100g AS "calPer100g", protein_per_100g AS "proteinPer100g",
           carbs_per_100g AS "carbsPer100g", fat_per_100g AS "fatPer100g",
           fiber_per_100g AS "fiberPer100g",
           micronutrients_per_100g AS "micronutrientsPer100g",
           micronutrients_verified AS "micronutrientsVerified",
           verified,
           1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM foods
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT 1
  `;

  const top = rows[0];
  if (!top || top.similarity < SIMILARITY_THRESHOLD) return null;
  return top;
}

// Recomputes macros from the verified per-100g data, scaled to the AI's portion
// estimate. Keeps `portionG`/`confidence` from the AI (that's what's in the photo),
// but trusts `foods` for the per-gram nutrition values.
export function applyFoodMatch(dish: DetectedDish, food: FoodMatch): DetectedDish {
  const ratio = dish.portionG / 100;

  // Scale verified micronutrients to the portion, and fold in fiber (a separate
  // column on `foods`) as `fiber_g` so it shows alongside the rest.
  const micros: Record<string, number> = {};
  if (food.micronutrientsPer100g) {
    for (const [k, v] of Object.entries(food.micronutrientsPer100g)) {
      if (typeof v === 'number') micros[k] = parseFloat((v * ratio).toFixed(2));
    }
  }
  if (food.fiberPer100g != null) {
    micros['fiber_g'] = parseFloat((food.fiberPer100g * ratio).toFixed(1));
  }

  return {
    ...dish,
    foodId: food.id,
    matchedFood: true,
    foodVerified: food.verified,
    calories: Math.round(food.calPer100g * ratio),
    proteinG: parseFloat((food.proteinPer100g * ratio).toFixed(1)),
    carbsG: parseFloat((food.carbsPer100g * ratio).toFixed(1)),
    fatG: parseFloat((food.fatPer100g * ratio).toFixed(1)),
    ...(Object.keys(micros).length
      ? { micronutrients: micros, microVerified: food.micronutrientsVerified }
      : {}),
  };
}
