import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

const prisma = new PrismaClient();

interface FoodRow {
  id: string;
  nameVi: string;
  nameEn: string | null;
  category: string | null;
}

// Backfills `foods.embedding` for RAG matching (see packages/api/src/ai/rag.ts).
// Idempotent: only embeds rows where embedding IS NULL, so it's safe to re-run
// after adding new foods. Requires OPENAI_API_KEY (text-embedding-3-small,
// 1536-dim, matching the `vector(1536)` column) — exits without writing
// anything if the key is missing, so foods stay NULL until a key is provided.
async function main() {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    console.log('OPENAI_API_KEY not set — skipping embedding backfill (RAG matching stays disabled).');
    return;
  }

  const openai = new OpenAI({ apiKey });

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

  for (const food of foods) {
    const text = `${food.nameVi} ${food.nameEn ?? ''} ${food.category ?? ''}`.trim();
    const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
    const embedding = response.data[0]?.embedding;
    if (!embedding) continue;

    const vectorLiteral = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`
      UPDATE foods SET embedding = ${vectorLiteral}::vector WHERE id = ${food.id}::uuid
    `;
  }

  console.log(`Embedded ${foods.length} foods`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
