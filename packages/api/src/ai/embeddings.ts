export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 1536;

const GEMINI_KEY = process.env['GOOGLE_GEMINI_API_KEY'];

// Embeds free-form text (dish names) for pgvector similarity search against
// `foods.embedding`. Uses Gemini's embedding API (same key as vision) with the
// output truncated to 1536 dims to match the schema's vector(1536). Returns a
// zero vector if no key is set, so RAG matching degrades to "no match" rather
// than crashing in dev.
export async function embedText(text: string): Promise<number[]> {
  if (!GEMINI_KEY) {
    console.log('[AI] No GOOGLE_GEMINI_API_KEY — using zero embedding (RAG matching disabled)');
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    console.error(`[AI] Embedding failed (${res.status}) — using zero embedding`);
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const json = (await res.json()) as { embedding?: { values?: number[] } };
  return json.embedding?.values ?? new Array(EMBEDDING_DIMENSIONS).fill(0);
}
