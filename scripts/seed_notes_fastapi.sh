#!/usr/bin/env bash
# Seed do modo FastAPI com a fixture compartilhada em português.
# Uso: bash scripts/seed_notes_fastapi.sh [--reset|--cleanup]

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT_DIR/scripts/seed_notes.py" --backend fastapi "$@"
