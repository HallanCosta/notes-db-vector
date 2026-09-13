#!/usr/bin/env bash
# Compatibilidade: o seeder em português agora usa a fixture compartilhada.
# Uso legado (Supabase): bash scripts/seed_notes_br.sh [--reset|--cleanup]

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT_DIR/scripts/seed_notes.py" --backend supabase "$@"
