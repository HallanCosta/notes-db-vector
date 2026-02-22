import { it, expect, vi, beforeEach } from 'vitest';
import { mockNote, mockEmbedding, createMockNoteInput } from './_fixtures/notes.ts';

const { title: testTitle, content: testContent } = createMockNoteInput;

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
  await import('../functions/create-note/index.ts');
});

const getHandler = () => (globalThis as any).__getHandler();

it('should create note with valid data', async () => {
  const { title, content } = { title: testTitle, content: testContent };

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ embedding: mockEmbedding })
  });

  const createdNote = { ...mockNote, title, content };
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [createdNote]
  });

  const handler = getHandler();

  const req = new Request('http://localhost/create-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(201);
  expect(data[0].title).toBe(title);
  expect(data[0].content).toBe(content);
});

it('should return 400 when title is missing', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/create-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Some content' })
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toContain('title');
});

it('should return 400 when content is missing', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/create-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Some title' })
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toContain('content');
});

it('should return 400 when both title and content are missing', async () => {
  const handler = getHandler();

  const req = new Request('http://localhost/create-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toContain('title');
  expect(data.error).toContain('content');
});

it('should handle Ollama embedding error', async () => {
  const handler = getHandler();

  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => 'Ollama error'
  });

  const req = new Request('http://localhost/create-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', content: 'Test content' })
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(500);
  expect(data.error).toContain('Ollama');
});

it('should handle database insert error', async () => {
  const handler = getHandler();

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ embedding: mockEmbedding })
  });

  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => 'Database error'
  });

  const req = new Request('http://localhost/create-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', content: 'Test content' })
  });

  const res = await handler(req);
  const data = await res.json();

  expect(res.status).toBe(500);
});
