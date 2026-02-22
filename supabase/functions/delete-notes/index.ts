// DELETE-NOTES - Deleta todas as notas
// DELETE /notes

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notes?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    return new Response(JSON.stringify({ message: 'All notes deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
