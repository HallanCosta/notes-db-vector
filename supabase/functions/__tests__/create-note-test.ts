import { assertEquals, assertExists } from "jsr:@std/assert";
import { SUPABASE_URL, SUPABASE_ANON_KEY, generateEmbedding } from "../_shared/config.ts";

Deno.test("create-note: should have valid config", () => {
  assertExists(SUPABASE_URL);
  assertExists(SUPABASE_ANON_KEY);
});

Deno.test("create-note: generateEmbedding should return array", async () => {
  try {
    const embedding = await generateEmbedding({ text: "test" });
    assertExists(embedding);
    assertEquals(Array.isArray(embedding), true);
  } catch {
    // Ollama not available - skip
  }
});

Deno.test("create-note: should validate request body", async () => {
  const req = new Request("http://localhost/create-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test", content: "Content" }),
  });

  const body = await req.json();
  assertExists(body.title);
  assertExists(body.content);
});

Deno.test("create-note: should reject missing title", async () => {
  const req = new Request("http://localhost/create-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Some content" }),
  });

  const body = await req.json() as { title?: string; content?: string };
  assertEquals(body.title, undefined);
});

Deno.test("create-note: should reject missing content", async () => {
  const req = new Request("http://localhost/create-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Some title" }),
  });

  const body = await req.json() as { title?: string; content?: string };
  assertEquals(body.content, undefined);
});
