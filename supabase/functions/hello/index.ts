// Hello Edge Function
Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ message: 'Hello from Supabase Edge Functions!' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
