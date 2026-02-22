import { it, expect, vi, beforeEach } from 'vitest';
import { mockEmbedding, mockSearchResults, mockNotes } from './_fixtures/notes.ts';

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
  await import('../functions/search-notes/index.ts');
});

const getHandler = () => (globalThis as any).__getHandler();

it('should search with semantic embeddings', async () => {
  const query = 'test query';

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ embedding: mockEmbedding })
  });

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockSearchResults
  });

  const handler = getHandler();

  const req = new Request(`http://localhost/search-notes?q=${encodeURIComponent(query)}`, {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(Array.isArray(data)).toBe(true);
});

it('should return 400 when query is missing', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/search-notes', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toContain('Query parameter');
});

it('should return 400 for empty query', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/search-notes?q=', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toContain('Query parameter');
});

it('should fallback to text search on RPC error', async () => {
  const query = 'test query';

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ embedding: mockEmbedding })
  });

  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => 'RPC error'
  });

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockNotes
  });

  const handler = getHandler();

  const req = new Request(`http://localhost/search-notes?q=${encodeURIComponent(query)}`, {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(Array.isArray(data)).toBe(true);
});

it('should return 405 for non-GET requests (POST)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/search-notes?q=test', {
    method: 'POST'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should return 405 for non-GET requests (DELETE)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/search-notes?q=test', {
    method: 'DELETE'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should handle Ollama embedding error', async () => {
  const query = 'test query';

  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => 'Ollama error'
  });

  const handler = getHandler();

  const req = new Request(`http://localhost/search-notes?q=${encodeURIComponent(query)}`, {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(500);
  expect(data.error).toContain('Ollama');
});
