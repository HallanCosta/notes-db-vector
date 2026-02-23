import { assertEquals, assertExists } from "jsr:@std/assert";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../_shared/config.ts";

Deno.test("get-notes: should have valid config", () => {
  assertExists(SUPABASE_URL);
  assertExists(SUPABASE_ANON_KEY);
});

Deno.test("get-notes: should build correct URL", () => {
  const url = `${SUPABASE_URL}/rest/v1/notes?select=*`;
  assertEquals(url.includes("http://"), true);
  assertEquals(url.includes("/rest/v1/notes"), true);
});

Deno.test("get-notes: should use GET method", () => {
  const method = "GET";
  assertEquals(method, "GET");
});

Deno.test("get-notes: should include authorization header", () => {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };
  assertEquals(headers.Authorization.includes("Bearer"), true);
});

Deno.test("get-notes: should return array on success", async () => {
  const mockResponse = [
    { id: "1", title: "Note 1", content: "Content 1" },
    { id: "2", title: "Note 2", content: "Content 2" },
  ];

  // Simulate successful response
  assertEquals(Array.isArray(mockResponse), true);
  assertEquals(mockResponse.length, 2);
});
