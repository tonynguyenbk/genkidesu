import { PrismaClient } from '@prisma/client';

// flash-lite has a separate per-model daily quota from 2.5-flash (used by scans).
const MODEL = 'gemini-2.5-flash-lite';
const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface FoodRow {
  id: string;
  nameVi: string;
  nameEn: string | null;
  calPer100g: number;
}

interface Nutrition {
  cal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

function buildPrompt(food: FoodRow): string {
  return `Bạn là chuyên gia dinh dưỡng. Cho món ăn Việt Nam: "${food.nameVi}"${food.nameEn ? ` (${food.nameEn})` : ''}.
Đây là món NƯỚC/LẨU đầy đủ khi dọn ra ăn (gồm sợi/bánh + thịt + nước dùng + topping), KHÔNG phải chỉ nước dùng loãng.

Ước tính giá trị dinh dưỡng TRÊN 100g của cả tô/phần ăn hoàn chỉnh đó. Trả về DUY NHẤT một JSON (không markdown):
{"cal_per_100g": 80, "protein_per_100g": 6, "carbs_per_100g": 9, "fat_per_100g": 2}

Lưu ý: một tô phở/bún/hủ tiếu đầy đủ thường ~70-95 cal/100g; lẩu ~65-85 cal/100g. Giá trị là số.`;
}

async function estimate(food: FoodRow, key: string): Promise<Nutrition | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  let res: Response | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(food) }] }] }),
    });
    if (res.ok) break;
    if (res.status === 429 || res.status === 503) {
      const wait = 5000 * (attempt + 1);
      console.error(`  [${food.nameVi}] HTTP ${res.status}, retry in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    console.error(`  [${food.nameVi}] HTTP ${res.status}`);
    return null;
  }
  if (!res || !res.ok) return null;

  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const p = JSON.parse(match[0]) as Partial<Nutrition>;
    if (
      typeof p.cal_per_100g === 'number' && p.cal_per_100g >= 50 && p.cal_per_100g <= 250 &&
      typeof p.protein_per_100g === 'number' &&
      typeof p.carbs_per_100g === 'number' &&
      typeof p.fat_per_100g === 'number'
    ) {
      return p as Nutrition;
    }
    console.error(`  [${food.nameVi}] out-of-range estimate: ${match[0]}`);
    return null;
  } catch {
    return null;
  }
}

// Re-estimates macros for noodle-soup / hotpot full meals whose seed cal_per_100g
// was set from broth-only values (too low). Targets category breakfast/main_dish
// with a large portion and low cal/100g — this excludes clear canh (soup, ~300g),
// drinks, desserts and porridge, which are correctly low.
async function main() {
  const apiKey = process.env['GOOGLE_GEMINI_API_KEY'];
  if (!apiKey) {
    console.log('GOOGLE_GEMINI_API_KEY not set — skipping.');
    return;
  }

  const foods = await prisma.$queryRaw<FoodRow[]>`
    SELECT id, name_vi AS "nameVi", name_en AS "nameEn", cal_per_100g AS "calPer100g"
    FROM foods
    WHERE cal_per_100g < 75
      AND typical_portion_g >= 400
      AND category IN ('breakfast', 'main_dish')
    ORDER BY cal_per_100g
  `;

  console.log(`Re-estimating nutrition for ${foods.length} noodle-soup/hotpot dishes...`);

  let done = 0;
  for (const food of foods) {
    const n = await estimate(food, apiKey);
    if (n) {
      await prisma.$executeRawUnsafe(
        `UPDATE foods SET cal_per_100g=$1, protein_per_100g=$2, carbs_per_100g=$3, fat_per_100g=$4 WHERE id=$5::uuid`,
        n.cal_per_100g, n.protein_per_100g, n.carbs_per_100g, n.fat_per_100g, food.id,
      );
      console.log(`  ${food.nameVi}: ${food.calPer100g} → ${n.cal_per_100g} cal/100g`);
      done++;
    }
    await sleep(4500);
  }

  console.log(`Updated ${done}/${foods.length} dishes`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
