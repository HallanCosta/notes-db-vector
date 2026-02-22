import { it, expect, vi, beforeEach } from 'vitest';
import { mockNotes } from './_fixtures/notes.ts';

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
  await import('../functions/get-notes/index.ts');
});

const getHandler = () => (globalThis as any).__getHandler();

it('should return all notes', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockNotes
  });

  const handler = getHandler();

  const req = new Request('http://localhost/get-notes', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBe(3);
});

it('should return empty array when no notes exist', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });

  const handler = getHandler();

  const req = new Request('http://localhost/get-notes', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data).toEqual([]);
});

it('should return 405 for non-GET requests (POST)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/get-notes', {
    method: 'POST'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
  expect(data.error).toContain('Method not allowed');
});

it('should return 405 for non-GET requests (PUT)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/get-notes', {
    method: 'PUT'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should return 405 for non-GET requests (DELETE)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/get-notes', {
    method: 'DELETE'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should handle database error', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => 'Database error'
  });

  const handler = getHandler();

  const req = new Request('http://localhost/get-notes', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(500);
});
