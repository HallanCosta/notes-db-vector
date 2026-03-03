export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ.M5YxZEaHHJzS2YaxZ5KZokoZow7f4vGiOVu3_nsMln2c';
export const SUPABASE_PUBLISHABLE_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Re-export from embeddings.ts
export { generateEmbedding, OLLAMA_URL, type GenerateEmbeddingOptions } from './embeddings.ts';
