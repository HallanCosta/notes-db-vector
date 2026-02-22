import { it, expect, vi, beforeEach } from 'vitest';
import { mockNote } from './_fixtures/notes.ts';

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
  await import('../functions/get-note/index.ts');
});

const getHandler = () => (globalThis as any).__getHandler();

it('should return note by ID', async () => {
  const noteId = '123e4567-e89b-12d3-a456-426614174000';

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [mockNote]
  });

  const handler = getHandler();

  const req = new Request(`http://localhost/get-note/${noteId}`, {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.id).toBe(noteId);
  expect(data.title).toBe(mockNote.title);
});

it('should return 404 for non-existent ID', async () => {
  const noteId = '999e4567-e89b-12d3-a456-426614174999';

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });

  const handler = getHandler();

  const req = new Request(`http://localhost/get-note/${noteId}`, {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(404);
  expect(data.error).toContain('not found');
});

it('should return 400 when ID is missing', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/get-note/', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toContain('ID');
});

it('should return 405 for non-GET requests (POST)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/get-note/123', {
    method: 'POST'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should return 405 for non-GET requests (DELETE)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/get-note/123', {
    method: 'DELETE'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});
