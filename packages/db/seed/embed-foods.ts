import { PrismaClient } from '@prisma/client';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 1536;

const prisma = new PrismaClient();

interface FoodRow {
  id: string;
  nameVi: string;
  nameEn: string | null;
  category: string | null;
}

async function embed(text: string, key: string): Promise<number[] | null> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });
  if (!res.ok) {
    console.error(`  embed failed (${res.status}): ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as { embedding?: { values?: number[] } };
  return json.embedding?.values ?? null;
}

// Backfills `foods.embedding` for RAG matching (see packages/api/src/ai/rag.ts).
// Idempotent: only embeds rows where embedding IS NULL, so it's safe to re-run
// after adding new foods. Uses Gemini's embedding API (gemini-embedding-001,
// 1536-dim, matching the `vector(1536)` column) — exits without writing anything
// if GOOGLE_GEMINI_API_KEY is missing, so foods stay NULL until a key is provided.
async function main() {
  const key = process.env['GOOGLE_GEMINI_API_KEY'];
  if (!key) {
    console.log('GOOGLE_GEMINI_API_KEY not set — skipping embedding backfill (RAG matching stays disabled).');
    return;
  }

  const foods = await prisma.$queryRaw<FoodRow[]>`
    SELECT id, name_vi AS "nameVi", name_en AS "nameEn", category
    FROM foods
    WHERE embedding IS NULL
  `;

  if (foods.length === 0) {
    console.log('All foods already have embeddings, skipping.');
    return;
  }

  console.log(`Embedding ${foods.length} foods...`);

  let done = 0;
  for (const food of foods) {
    const text = `${food.nameVi} ${food.nameEn ?? ''} ${food.category ?? ''}`.trim();
    const embedding = await embed(text, key);
    if (embedding) {
      const vectorLiteral = `[${embedding.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE foods SET embedding = ${vectorLiteral}::vector WHERE id = ${food.id}::uuid
      `;
      done++;
    }
    // Gemini free tier is rate-limited — small delay keeps us well under the cap.
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`Embedded ${done}/${foods.length} foods`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
