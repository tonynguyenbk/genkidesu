import OpenAI from 'openai';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

const client = process.env['OPENAI_API_KEY']
  ? new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
  : null;

// Embeds free-form text (dish names) for pgvector similarity search against
// `foods.embedding`. Returns a zero vector if OPENAI_API_KEY isn't set, so RAG
// matching degrades to "no match" rather than crashing in dev.
export async function embedText(text: string): Promise<number[]> {
  if (!client) {
    console.log('[AI] No OPENAI_API_KEY — using zero embedding (RAG matching disabled)');
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0]?.embedding ?? new Array(EMBEDDING_DIMENSIONS).fill(0);
}
