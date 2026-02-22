// Mock Deno globals for testing in Node.js environment

const mockEnv: Record<string, string | undefined> = {
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'test-anon-key',
  OLLAMA_URL: 'http://localhost:11434',
};

// Store the handler passed to Deno.serve
let storedHandler: ((req: Request) => Promise<Response>) | null = null;

const mockDeno = {
  env: {
    get: (key: string) => mockEnv[key],
  },
  serve: (handler: (req: Request) => Promise<Response>) => {
    storedHandler = handler;
    // Return an object with a listen method that doesn't actually start a server
    return {
      async fetch(req: Request) {
        return handler(req);
      }
    };
  },
};

// Override Deno.serve to capture the handler
const originalDenoServe = (globalThis as any).Deno?.serve;

Object.defineProperty(globalThis, 'Deno', {
  value: mockDeno,
  writable: true,
  configurable: true,
});

// Re-export the handler for tests to use
(globalThis as any).__getHandler = () => storedHandler;
