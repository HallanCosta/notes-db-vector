# Notes CRUD - Supabase

[FastAPI README](README.md) · [README em Português](README-ptBR.md)

This document covers the preserved Supabase workflow: local Supabase services,
Edge Functions, Realtime and the FastAPI chat API connected to Supabase's local
PostgreSQL database.

## Requirements

- [Docker](https://www.docker.com)
- Node.js, pnpm and npx
- Supabase CLI, or npx (the startup script can use `npx supabase`)
- Deno for Edge Function tests

## Quick start

Configure the backend once if you want to use Chat AI:

```bash
cp server/.env.example server/.env
```

Set `GROQ_API_KEY` in `server/.env` with a real key. Do not put it in the frontend
or commit the file.

Install frontend dependencies:

```bash
cd web
pnpm install
cd ..
```

Make sure the embedding model is available in Ollama, then start the complete
Supabase workflow:

```bash
docker compose up -d ollama
docker exec notes-ollama ollama pull qwen3-embedding:4b
bash scripts/start-supabase.sh
```

The startup script starts:

- local Supabase (PostgreSQL, API, Studio and Realtime)
- the FastAPI server connected to Supabase PostgreSQL
- Supabase Edge Functions
- the React frontend in `supabase` mode

Press `Ctrl+C` in the startup terminal to stop the services managed by the
script. Do not run `start-fastapi.sh` and `start-supabase.sh` at the same time.

## Local URLs

- Frontend: http://localhost:5173
- Supabase API: http://127.0.0.1:54321
- Supabase Studio: http://127.0.0.1:54323
- Supabase database: `127.0.0.1:54322`
- Ollama: http://127.0.0.1:11435
- FastAPI docs: http://127.0.0.1:8003/docs

The FastAPI server is part of this workflow because Chat AI and chat history use
its `/chat` and `/chat/messages` endpoints, while notes and semantic search use
Supabase Edge Functions.

## Seed notes

With the Supabase workflow running, use the shared Portuguese fixture:

```bash
bash scripts/seed_notes_br.sh --reset
bash scripts/seed_notes_br.sh --cleanup
```

The equivalent direct command is:

```bash
python3 scripts/seed_notes.py --backend supabase --reset
python3 scripts/seed_notes.py --backend supabase --cleanup
```

The old English fixture is still available for compatibility:

```bash
bash scripts/seed_notes_en.sh
```

Use the fixture prefix to keep test notes separate from manual notes. The seeder
removes notes created during a failed run and supports a custom prefix:

```bash
python3 scripts/seed_notes.py --backend supabase --prefix "[e2e:pt-br]" --reset
python3 scripts/seed_notes.py --backend supabase --prefix "[e2e:pt-br]" --cleanup
```

## Tests

Supabase Edge Function tests:

```bash
cd supabase
deno task test:run
deno task test:coverage
deno task test:integration
```

The integration suite requires the local Supabase services, Ollama, the FastAPI
server and the Edge Functions to be running.

Frontend tests against Supabase:

```bash
cd web
VITE_BACKEND_MODE=supabase pnpm test:integration
```

## Database and functions

- `supabase/migrations/` contains the schema migrations.
- `supabase/functions/` contains the preserved Edge Functions.
- `supabase/config.toml` configures the local Supabase services.
- `supabase/seed.sql` is a database dump kept for reference; automatic seed
  loading is disabled because it is not compatible with the local seed runner.

Use the application seeders above instead of expecting `supabase/seed.sql` to
populate the local database automatically.
