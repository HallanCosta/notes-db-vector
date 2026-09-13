// Funções de Embedding usando Ollama

export const OLLAMA_URL = Deno.env.get('OLLAMA_URL') || 'http://notes-ollama:11434';
export const EMBEDDING_MODEL = Deno.env.get('OLLAMA_EMBEDDING_MODEL') || 'qwen3-embedding:4b';
export const EMBEDDING_DIMENSIONS = Number(Deno.env.get('EMBEDDING_DIMENSIONS') || '2560');

export interface GenerateEmbeddingOptions {
  text: string;
  model?: string;
}

export async function generateEmbedding({ text }: GenerateEmbeddingOptions): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${await response.text()}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.embedding) || data.embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, received ${data.embedding?.length ?? 0}`,
    );
  }
  return data.embedding;
}
