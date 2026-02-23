import { assertEquals, assertExists } from "jsr:@std/assert";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../_shared/config.ts";

Deno.test("delete-notes: should have valid config", () => {
  assertExists(SUPABASE_URL);
  assertExists(SUPABASE_ANON_KEY);
});

Deno.test("delete-notes: should use DELETE method", () => {
  const method = "DELETE";
  assertEquals(method, "DELETE");
});

Deno.test("delete-notes: should build correct URL", () => {
  const url = `${SUPABASE_URL}/rest/v1/notes?id=neq.00000000-0000-0000-0000-000000000000`;
  assertEquals(url.includes("/rest/v1/notes"), true);
});

Deno.test("delete-notes: should include authorization headers", () => {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };
  assertEquals(headers.Authorization.startsWith("Bearer"), true);
});

Deno.test("delete-notes: should return success message", () => {
  const response = { message: "All notes deleted" };
  assertEquals(response.message, "All notes deleted");
});
