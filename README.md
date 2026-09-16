# Notes CRUD - FastAPI

[🇧🇷 Leia este README em Português](README-ptBR.md)

A notes application with semantic search using React, FastAPI, PostgreSQL/pgvector
and Ollama. The default local workflow runs entirely through the FastAPI stack.

The previous Supabase backend is still available in a separate workflow. See
[README-supabase.md](README-supabase.md) when you need it.

## Screenshots

![Notes workspace](designs/notes.png)

![Chat AI](designs/chat-ai.png)

## Requirements

- [Docker](https://www.docker.com)
- Node.js and pnpm
- Python 3.11+ only for local scripts or tests

## Quick start

From the project root, configure the backend once:

```bash
cp server/.env.example server/.env
```

Add your Groq key to `server/.env` if you want to use Chat AI:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Install the frontend dependencies and start the complete local environment:

```bash
cd web
pnpm install
cd ..
bash scripts/start-fastapi.sh
```

The script starts PostgreSQL/pgvector, Ollama, FastAPI and the Vite frontend. It
also downloads `qwen3-embedding:4b` when needed.

- App: http://localhost:5173
- API docs: http://127.0.0.1:8003/docs

Press `Ctrl+C` to stop the services started by the script. Local PostgreSQL data
is persisted in `.docker/postgres_data`.

If you only need the backend services in the background:

```bash
docker compose up -d postgres ollama server
docker exec notes-ollama ollama pull qwen3-embedding:4b
```

## Chat AI

When `CHAT_PROVIDER` is not set, the backend uses Groq automatically when
`GROQ_API_KEY` is available, with the `qwen/qwen3.8-27b` model. Use `CHAT_PROVIDER`
and `GROQ_MODEL` to override it. Never expose the key in the frontend or commit it.

If communication with the assistant fails, the interface keeps the submitted
message and shows: “Não consegui me conectar com o assistente. Verifique a conexão
e tente novamente.”

## Seed notes

With the local services running, populate the Portuguese fixture (36 notes with
real Qwen embeddings):

```bash
bash scripts/seed_notes_fastapi.sh --reset
```

Remove only the fixture notes when you are done:

```bash
bash scripts/seed_notes_fastapi.sh --cleanup
```

The Python form supports the same operations plus a custom prefix:

```bash
python3 scripts/seed_notes.py --backend fastapi --reset
python3 scripts/seed_notes.py --backend fastapi --prefix "[e2e:pt-br]" --reset
python3 scripts/seed_notes.py --backend fastapi --prefix "[e2e:pt-br]" --cleanup
```

Useful semantic-search queries include `banco central`, `split payment`,
`random key` and `barcode`.

## Tests

Unit tests and the production build:

```bash
cd web
pnpm test:run
pnpm build
```

With the FastAPI environment running, execute the Playwright tests in another
terminal:

```bash
cd web
pnpm test:e2e
```

The E2E suite covers Chat AI failure handling and semantic search cleanup.

## Project structure

```text
server/          FastAPI API, PostgreSQL access and chat provider configuration
web/             React + TypeScript frontend
postgres/init/   PostgreSQL + pgvector schema
scripts/         Local seeders, startup helpers and cleanup scripts
supabase/        Preserved Supabase backend; see README-supabase.md
```

## Tech stack

FastAPI · PostgreSQL/pgvector · Ollama · React · TypeScript · Vite · Tailwind CSS
