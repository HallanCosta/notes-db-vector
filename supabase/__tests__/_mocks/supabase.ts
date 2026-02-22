import { vi } from 'vitest';
import { mockEmbedding } from '../_fixtures/notes.ts';

export function createOllamaMockSuccess() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ embedding: mockEmbedding })
  });
}

export function createOllamaMockError(message: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    text: async () => message
  });
}

export function createSupabaseMockSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data
  });
}

export function createSupabaseMockError(message: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    text: async () => message
  });
}

export function mockFetch(ollamaMock: ReturnType<typeof vi.fn>, supabaseMock: ReturnType<typeof vi.fn>) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('ollama') || url.includes('11434')) {
      return ollamaMock();
    }
    if (url.includes('supabase') || url.includes('54321')) {
      return supabaseMock();
    }
    return Promise.reject(new Error('Unknown URL'));
  });
}
