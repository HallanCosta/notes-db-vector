// GET-NOTE - Busca nota por ID
// GET /notes/:id

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/notes?id=eq.${id}&select=id,title,content,created_at`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    const data = await response.json();

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(data[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
