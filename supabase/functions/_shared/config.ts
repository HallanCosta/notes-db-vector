export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ.M5YxZEaHHJzS2YaxZ5KZokoZow7f4vGiOVu3_nsMln2c';
export const SUPABASE_PUBLISHABLE_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const OLLAMA_URL = Deno.env.get('OLLAMA_URL') || 'http://host.docker.internal:11434';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.embedding;
}
