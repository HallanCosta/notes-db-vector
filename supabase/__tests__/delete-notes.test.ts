import { it, expect, vi, beforeEach } from 'vitest';

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
  await import('../functions/delete-notes/index.ts');
});

const getHandler = () => (globalThis as any).__getHandler();

it('should delete all notes', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({})
  });

  const handler = getHandler();

  const req = new Request('http://localhost/delete-notes', {
    method: 'DELETE'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.message).toContain('deleted');
});

it('should return 405 for non-DELETE requests (GET)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/delete-notes', {
    method: 'GET'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
  expect(data.error).toContain('Method not allowed');
});

it('should return 405 for non-DELETE requests (POST)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/delete-notes', {
    method: 'POST'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should return 405 for non-DELETE requests (PUT)', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/delete-notes', {
    method: 'PUT'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(405);
});

it('should return success regardless of database response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => 'Database error'
  });

  const handler = getHandler();

  const req = new Request('http://localhost/delete-notes', {
    method: 'DELETE'
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.message).toContain('deleted');
});
