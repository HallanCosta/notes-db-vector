#!/usr/bin/env python3
"""Populate either backend with the shared Portuguese semantic-search fixture."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT_DIR / "scripts" / "data" / "notes_pt_br.json"
DEFAULT_PREFIX = "[seed:pt-br]"
DEFAULT_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ."
    "M5YxZEaHHJzS2YaxZ5KZokoZw7f4vGiOVu3_nsMln2c"
)


class SeedError(RuntimeError):
    """Raised when the seed API cannot complete a request."""


class BackendClient:
    def __init__(self, backend: str, base_url: str, anon_key: str = "") -> None:
        self.backend = backend
        self.base_url = base_url.rstrip("/")
        self.anon_key = anon_key

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.backend == "supabase":
            headers["apikey"] = self.anon_key
            headers["Authorization"] = f"Bearer {self.anon_key}"
        return headers

    def request(self, method: str, path: str, payload: Any = None) -> Any:
        body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = Request(
            f"{self.base_url}{path}",
            data=body,
            headers=self._headers(),
            method=method,
        )

        try:
            with urlopen(request, timeout=180) as response:
                raw = response.read()
                if not raw:
                    return None
                return json.loads(raw.decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise SeedError(f"{method} {path} retornou HTTP {error.code}: {detail}") from error
        except URLError as error:
            raise SeedError(f"Não foi possível acessar {self.base_url}: {error.reason}") from error
        except json.JSONDecodeError as error:
            raise SeedError(f"{method} {path} retornou JSON inválido") from error

    def list_notes(self) -> list[dict[str, Any]]:
        path = "/notes?limit=1000" if self.backend == "fastapi" else "/functions/v1/get-notes"
        result = self.request("GET", path)
        if not isinstance(result, list):
            raise SeedError(f"Resposta inesperada ao listar notas: {result!r}")
        return result

    def create_note(self, title: str, content: str) -> dict[str, Any]:
        path = "/notes" if self.backend == "fastapi" else "/functions/v1/create-note"
        result = self.request("POST", path, {"title": title, "content": content})
        if not isinstance(result, list) or not result or not isinstance(result[0], dict):
            raise SeedError(f"Resposta inesperada ao criar nota: {result!r}")
        return result[0]

    def delete_notes(self, note_ids: list[str]) -> int:
        if not note_ids:
            return 0

        if self.backend == "fastapi":
            deleted = 0
            for note_id in note_ids:
                result = self.request("DELETE", f"/notes/{note_id}")
                deleted += int(result.get("deleted", 0)) if isinstance(result, dict) else 0
            return deleted

        query = urlencode({"id": f"in.({','.join(note_ids)})"})
        request = Request(
            f"{self.base_url}/rest/v1/notes?{query}",
            headers={
                "apikey": self.anon_key,
                "Authorization": f"Bearer {self.anon_key}",
                "Prefer": "return=minimal",
            },
            method="DELETE",
        )
        try:
            with urlopen(request, timeout=60) as response:
                if response.status not in (200, 204):
                    raise SeedError(f"DELETE de notas retornou HTTP {response.status}")
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise SeedError(f"DELETE de notas retornou HTTP {error.code}: {detail}") from error
        return len(note_ids)


def load_fixture(path: Path) -> list[dict[str, str]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SeedError(f"Não foi possível ler a fixture {path}: {error}") from error

    if not isinstance(data, list) or not data:
        raise SeedError("A fixture deve ser uma lista não vazia de notas")

    required = {"category", "title", "content"}
    for index, note in enumerate(data, start=1):
        if not isinstance(note, dict) or not required.issubset(note):
            raise SeedError(f"Nota #{index} precisa de category, title e content")
        if not all(isinstance(note[field], str) and note[field].strip() for field in required):
            raise SeedError(f"Nota #{index} possui campos vazios ou inválidos")
    return data


def make_client(args: argparse.Namespace) -> BackendClient:
    if args.backend == "fastapi":
        base_url = args.base_url or os.getenv("FASTAPI_URL", "http://127.0.0.1:8003")
        return BackendClient(args.backend, base_url)

    base_url = args.base_url or os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    anon_key = args.anon_key or os.getenv("SUPABASE_ANON_KEY", DEFAULT_ANON_KEY)
    return BackendClient(args.backend, base_url, anon_key)


def find_seed_ids(client: BackendClient, prefix: str) -> list[str]:
    notes = client.list_notes()
    return [
        str(note["id"])
        for note in notes
        if isinstance(note.get("id"), str)
        and isinstance(note.get("title"), str)
        and note["title"].startswith(prefix)
    ]


def cleanup(client: BackendClient, prefix: str) -> int:
    note_ids = find_seed_ids(client, prefix)
    deleted = client.delete_notes(note_ids)
    print(f"Limpeza {prefix}: {deleted} nota(s) removida(s).")
    return deleted


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", choices=("fastapi", "supabase"), default=os.getenv("SEED_BACKEND", "fastapi"))
    parser.add_argument("--base-url", help="URL base do backend selecionado")
    parser.add_argument("--anon-key", help="Chave anon do Supabase")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="Arquivo JSON da fixture")
    parser.add_argument("--prefix", default=os.getenv("SEED_TITLE_PREFIX", DEFAULT_PREFIX))
    parser.add_argument("--reset", action="store_true", help="Remove notas desta fixture antes de inserir")
    parser.add_argument("--cleanup", action="store_true", help="Remove notas desta fixture e encerra")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.prefix.strip():
        print("Erro: --prefix não pode ser vazio; isso evita uma limpeza ampla.", file=sys.stderr)
        return 2

    try:
        client = make_client(args)
        if args.cleanup:
            cleanup(client, args.prefix)
            return 0

        if args.reset:
            cleanup(client, args.prefix)

        fixture = load_fixture(args.data)
        created_ids: list[str] = []
        print(f"Inserindo {len(fixture)} notas em {args.backend} com prefixo {args.prefix!r}...")

        try:
            for index, note in enumerate(fixture, start=1):
                title = f"{args.prefix} {note['title']}"
                created = client.create_note(title, note["content"])
                created_ids.append(str(created["id"]))
                print(f"  [{index:02d}/{len(fixture)}] OK {note['category']}: {note['title']}")
        except Exception:
            if created_ids:
                print("Falha durante o seed; removendo notas inseridas nesta execução...", file=sys.stderr)
                client.delete_notes(created_ids)
            raise

        print(f"Concluído: {len(created_ids)} nota(s) criada(s).")
        print(f"Para limpar: python3 scripts/seed_notes.py --backend {args.backend} --cleanup")
        return 0
    except SeedError as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
