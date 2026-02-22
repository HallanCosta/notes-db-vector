#!/usr/bin/env bash
# Deleta todas as notas do banco
# Uso: bash scripts/delete_all_notes.sh

SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ.M5YxZEaHHJzS2YaxZ5KZokoZw7f4vGiOVu3_nsMln2c}"

echo "Deletando todas as notas..."

status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  "$SUPABASE_URL/rest/v1/notes?id=neq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

if [ "$status" = "204" ]; then
  echo "Concluido: todas as notas foram deletadas."
else
  echo "Erro: HTTP $status"
  exit 1
fi
