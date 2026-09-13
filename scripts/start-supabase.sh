#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null 2>&1 || { echo "Erro: Docker não encontrado." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Erro: pnpm não encontrado." >&2; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "Erro: npx não encontrado." >&2; exit 1; }

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_CMD=(supabase)
else
  SUPABASE_CMD=(npx --yes supabase)
fi

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "Parando serviços do modo Supabase..."
  if [[ -n "${FUNCTIONS_PID:-}" ]]; then
    kill "$FUNCTIONS_PID" 2>/dev/null || true
    wait "$FUNCTIONS_PID" 2>/dev/null || true
  fi
  docker compose -f docker-compose.supabase.yml stop server >/dev/null 2>&1 || true
  "${SUPABASE_CMD[@]}" stop >/dev/null 2>&1 || true
  docker compose stop ollama >/dev/null 2>&1 || true
}

trap cleanup INT TERM EXIT

echo "Iniciando Ollama do projeto..."
docker compose up -d ollama

echo "Iniciando Supabase local..."
"${SUPABASE_CMD[@]}" start

echo "Iniciando API FastAPI conectada ao PostgreSQL do Supabase..."
docker compose -f docker-compose.supabase.yml up -d server

echo "Iniciando Edge Functions..."
(
  OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11435}" \
    "${SUPABASE_CMD[@]}" functions serve
) &
FUNCTIONS_PID=$!

echo "Frontend: http://localhost:5173"
echo "Supabase API: http://127.0.0.1:54321"
echo "Pressione Ctrl+C para desligar este modo."

cd "$ROOT_DIR/web"
VITE_BACKEND_MODE=supabase \
  VITE_SUPABASE_URL=http://127.0.0.1:54321 \
  VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ.M5YxZEaHHJzS2YaxZ5KZokoZw7f4vGiOVu3_nsMln2c" \
  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH \
  pnpm dev

kill "$FUNCTIONS_PID" 2>/dev/null || true
