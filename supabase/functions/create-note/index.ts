// CREATE-NOTE - Cria uma nota com embedding
// POST /notes

import { SUPABASE_URL, SUPABASE_ANON_KEY, generateEmbedding } from '../_shared/config.ts';

Deno.serve(async (req) => {
  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'title and content are required' }), { status: 400 });
    }

    const embedding = await generateEmbedding(content);

    // Insere no banco via PostgREST
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        title,
        content,
        embedding: `[${embedding.join(',')}]`
      })
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      throw new Error(`Database error: ${error}`);
    }

    const result = await insertResponse.json();

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
