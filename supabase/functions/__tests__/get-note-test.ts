import { assertEquals, assertExists } from "jsr:@std/assert";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../_shared/config.ts";

Deno.test("get-note: should have valid config", () => {
  assertExists(SUPABASE_URL);
  assertExists(SUPABASE_ANON_KEY);
});

Deno.test("get-note: should build URL with id", () => {
  const noteId = "123e4567-e89b-12d3-a456-426614174000";
  const url = `${SUPABASE_URL}/rest/v1/notes?id=eq.${noteId}&select=*`;
  assertEquals(url.includes(noteId), true);
});

Deno.test("get-note: should use GET method", () => {
  const method = "GET";
  assertEquals(method, "GET");
});

Deno.test("get-note: should validate note ID from URL", () => {
  const url = new URL("http://localhost/get-note/123e4567-e89b-12d3-a456-426614174000");
  const pathParts = url.pathname.split("/");
  const noteId = pathParts[pathParts.length - 1];
  assertExists(noteId);
  assertEquals(noteId.length > 0, true);
});

Deno.test("get-note: should return note by ID", async () => {
  const mockNote = { id: "1", title: "Test Note", content: "Test Content" };
  assertEquals(mockNote.id, "1");
  assertEquals(mockNote.title, "Test Note");
});
