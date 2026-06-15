import { prisma } from '@genki/db';
import { embedText } from './embeddings.js';
import type { DetectedDish } from './vision.js';

type PrismaInstance = typeof prisma;

// Cosine similarity below this is treated as "no match" — AI's own estimate is kept.
const SIMILARITY_THRESHOLD = 0.8;

interface FoodMatch {
  id: string;
  nameVi: string;
  nameEn: string | null;
  calPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
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
  return {
    ...dish,
    foodId: food.id,
    matchedFood: true,
    calories: Math.round(food.calPer100g * ratio),
    proteinG: parseFloat((food.proteinPer100g * ratio).toFixed(1)),
    carbsG: parseFloat((food.carbsPer100g * ratio).toFixed(1)),
    fatG: parseFloat((food.fatPer100g * ratio).toFixed(1)),
  };
}
