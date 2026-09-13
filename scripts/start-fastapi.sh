#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null 2>&1 || { echo "Erro: Docker não encontrado." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Erro: pnpm não encontrado." >&2; exit 1; }

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "Parando serviços do modo FastAPI..."
  docker compose stop server postgres ollama >/dev/null 2>&1 || true
}

trap cleanup INT TERM EXIT

echo "Iniciando PostgreSQL + pgvector, Ollama e FastAPI..."
docker compose up -d postgres ollama server

OLLAMA_EMBEDDING_MODEL="${OLLAMA_EMBEDDING_MODEL:-qwen3-embedding:4b}"
echo "Garantindo modelo de embedding no Ollama: $OLLAMA_EMBEDDING_MODEL"
docker exec notes-ollama ollama pull "$OLLAMA_EMBEDDING_MODEL"

echo "Frontend: http://localhost:5173"
echo "API FastAPI: http://127.0.0.1:8003/docs"
echo "Pressione Ctrl+C para desligar este modo."

cd "$ROOT_DIR/web"
VITE_BACKEND_MODE=fastapi pnpm dev
