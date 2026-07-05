import { PrismaClient } from '@prisma/client';

// 2.5-flash's free daily quota is small and shared with photo scans; flash-lite
// has a separate (larger) per-model quota, so use it for bulk backfill.
const MODEL = 'gemini-2.5-flash-lite';
const prisma = new PrismaClient();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface FoodRow {
  id: string;
  nameVi: string;
  nameEn: string | null;
  category: string | null;
}

const PROMPT_KEYS = [
  'sodium_mg', 'calcium_mg', 'iron_mg', 'zinc_mg', 'potassium_mg', 'magnesium_mg',
  'phosphorus_mg', 'fiber_g', 'vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_e_mg',
  'vitamin_b6_mg', 'vitamin_b12_mcg', 'folate_mcg', 'omega3_mg',
];

function buildPrompt(food: FoodRow): string {
  return `Bạn là chuyên gia dinh dưỡng. Ước tính hàm lượng vi chất TRÊN 100g của món ăn Việt Nam sau:
Tên: ${food.nameVi}${food.nameEn ? ` (${food.nameEn})` : ''}${food.category ? `, nhóm: ${food.category}` : ''}

Trả về DUY NHẤT một JSON object (không markdown, không giải thích) với các key sau (chỉ gồm chất có lượng đáng kể, bỏ qua chất ~0):
${PROMPT_KEYS.join(', ')}

Đơn vị theo hậu tố: _mg = miligam, _mcg = microgam, _g = gam, _iu = IU.
Giá trị là số (number). Ví dụ: {"sodium_mg": 480, "calcium_mg": 25, "iron_mg": 1.8, "fiber_g": 2.1, "vitamin_c_mg": 5}`;
}

async function estimate(food: FoodRow, key: string): Promise<Record<string, number> | null> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  // Retry on transient overload (503) / rate limit (429) with backoff.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(food) }] }] }),
    });
    if (res.ok) break;
    if (res.status === 429 || res.status === 503) {
      const wait = 5000 * (attempt + 1); // 5s, 10s, 15s, 20s, 25s
      console.error(`  [${food.nameVi}] HTTP ${res.status}, retry in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    console.error(`  [${food.nameVi}] HTTP ${res.status}`);
    return null;
  }
  if (!res || !res.ok) {
    console.error(`  [${food.nameVi}] gave up after retries`);
    return null;
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number' && v > 0) clean[k] = v;
    }
    return clean;
  } catch {
    return null;
  }
}

// Fills `micronutrients_per_100g` (and `fiber_per_100g` when null) for foods that
// lack them, using Gemini text estimation from the dish name. Leaves
// `micronutrients_verified = false` (the default) so the UI shows "Ước tính".
// Idempotent: only touches rows where micronutrients_per_100g IS NULL.
async function main() {
  const apiKey = process.env['GOOGLE_GEMINI_API_KEY'];
  if (!apiKey) {
    console.log('GOOGLE_GEMINI_API_KEY not set — skipping micronutrient fill.');
    return;
  }

  const foods = await prisma.$queryRaw<FoodRow[]>`
    SELECT id, name_vi AS "nameVi", name_en AS "nameEn", category
    FROM foods
    WHERE micronutrients_per_100g IS NULL
  `;

  if (foods.length === 0) {
    console.log('All foods already have micronutrients, skipping.');
    return;
  }

  console.log(`Filling micronutrients for ${foods.length} foods (AI-estimated)...`);

  let done = 0;
  for (const food of foods) {
    const micros = await estimate(food, apiKey);
    if (micros && Object.keys(micros).length > 0) {
      // fiber_g lives in its own column; the rest go into micronutrients_per_100g.
      const fiber = micros['fiber_g'];
      delete micros['fiber_g'];

      const microsJson = JSON.stringify(micros);
      await prisma.$executeRawUnsafe(
        `UPDATE foods SET micronutrients_per_100g = $1::jsonb WHERE id = $2::uuid`,
        microsJson, food.id,
      );
      if (fiber != null) {
        await prisma.$executeRawUnsafe(
          `UPDATE foods SET fiber_per_100g = $1 WHERE id = $2::uuid AND fiber_per_100g IS NULL`,
          fiber, food.id,
        );
      }
      done++;
    } else {
      console.error(`  [${food.nameVi}] no estimate`);
    }
    // Gemini free tier is rate-limited (~15 RPM) — keep a margin.
    await sleep(4500);
  }

  console.log(`Filled ${done}/${foods.length} foods (micronutrients_verified = false)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
