// SEARCH-NOTES - Busca notas por similaridade vetorial
// GET /notes/search?q=...

import { SUPABASE_URL, SUPABASE_ANON_KEY, generateEmbedding } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query parameter q is required' }), { status: 400 });
    }

    const embedding = await generateEmbedding({ text: query });

    // Busca por similaridade usando RPC
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_count: 6
      })
    });

    if (!response.ok) {
      // Fallback: busca em title e content
      const simpleResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/notes?or=(title.ilike.*${encodeURIComponent(query)}*,content.ilike.*${encodeURIComponent(query)}*)&limit=10`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );
      const data = await simpleResponse.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
