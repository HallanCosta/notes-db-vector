// Funções de Embedding usando Ollama

export const OLLAMA_URL = Deno.env.get('OLLAMA_URL') || 'http://notes-ollama:11434';

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
      model: 'qwen3-embedding:4b',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.embedding;
}
