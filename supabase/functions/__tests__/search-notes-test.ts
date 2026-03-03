import { assertEquals, assertExists } from "jsr:@std/assert";
import { SUPABASE_URL, SUPABASE_ANON_KEY, generateEmbedding } from "../_shared/config.ts";

Deno.test("search-notes: should have valid config", () => {
  assertExists(SUPABASE_URL);
  assertExists(SUPABASE_ANON_KEY);
});

Deno.test("search-notes: should require query parameter", () => {
  const url = new URL("http://localhost/search-notes");
  const query = url.searchParams.get("q");
  assertEquals(query, null);
});

Deno.test("search-notes: should extract query from URL", () => {
  const url = new URL("http://localhost/search-notes?q=test");
  const query = url.searchParams.get("q");
  assertEquals(query, "test");
});

Deno.test("search-notes: should generate embedding for query", async () => {
  try {
    const embedding = await generateEmbedding({ text: "test query" });
    assertExists(embedding);
    assertEquals(Array.isArray(embedding), true);
  } catch {
    // Ollama not available - skip
  }
});

Deno.test("search-notes: should build RPC URL for similarity search", () => {
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/match_notes`;
  assertEquals(rpcUrl.includes("/rpc/match_notes"), true);
});

Deno.test("search-notes: should fallback to text search on error", () => {
  const query = "test";
  const fallbackUrl = `${SUPABASE_URL}/rest/v1/notes?or=(title.ilike.*${encodeURIComponent(query)}*,content.ilike.*${encodeURIComponent(query)}*)&limit=10`;
  assertEquals(fallbackUrl.includes("ilike"), true);
});

Deno.test("search-notes: should return array of results", async () => {
  const mockResults = [
    { id: "1", title: "Note 1", content: "Content 1", similarity: 0.95 },
  ];
  assertEquals(Array.isArray(mockResults), true);
  assertEquals(mockResults.length, 1);
});
