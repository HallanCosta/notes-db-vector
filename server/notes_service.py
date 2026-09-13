"""Direct PostgreSQL/pgvector operations for the lightweight local mode."""

import math
import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

from database import db

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "2560"))


def generate_embedding(text: str) -> List[float]:
    """Generate an embedding using the local Ollama HTTP API."""
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": OLLAMA_EMBEDDING_MODEL, "prompt": text},
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as error:
        raise RuntimeError(f"Não foi possível gerar embedding no Ollama: {error}") from error

    embedding = data.get("embedding")
    if not isinstance(embedding, list) or not embedding:
        raise RuntimeError("Ollama retornou um embedding inválido")

    if len(embedding) != EMBEDDING_DIMENSIONS:
        raise RuntimeError(
            "Dimensão do embedding incompatível: "
            f"esperado {EMBEDDING_DIMENSIONS}, recebido {len(embedding)}"
        )

    return [float(value) for value in embedding]


def _vector_literal(embedding: List[float]) -> str:
    """Format a Python embedding as a pgvector/halfvec literal."""
    if not all(math.isfinite(value) for value in embedding):
        raise ValueError("Embedding contém valor não finito")
    return "[" + ",".join(format(value, ".9g") for value in embedding) + "]"


def list_notes(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT id, title, content, created_at
        FROM notes
        ORDER BY created_at DESC
    """
    params: tuple = ()
    if limit is not None:
        query += " LIMIT %s"
        params = (limit,)
    return db.execute_query(query, params)


def get_note(note_id: str) -> Optional[Dict[str, Any]]:
    return db.execute_one(
        """
        SELECT id, title, content, created_at
        FROM notes
        WHERE id = %s
        """,
        (note_id,),
    )


def create_note(title: str, content: str) -> Dict[str, Any]:
    embedding = _vector_literal(generate_embedding(content))
    note = db.execute_with_return(
        """
        INSERT INTO notes (title, content, embedding)
        VALUES (%s, %s, %s::halfvec)
        RETURNING id, title, content, created_at
        """,
        (title, content, embedding),
    )
    if note is None:
        raise RuntimeError("O banco não retornou a nota criada")
    return note


def search_notes(query_text: str, limit: int = 6) -> List[Dict[str, Any]]:
    embedding = _vector_literal(generate_embedding(query_text))
    return db.execute_query(
        """
        WITH query_embedding AS (
            SELECT %s::halfvec AS value
        )
        SELECT
            notes.id,
            notes.title,
            notes.content,
            notes.created_at,
            1 - (notes.embedding <=> query_embedding.value) AS similarity
        FROM notes
        CROSS JOIN query_embedding
        ORDER BY notes.embedding <=> query_embedding.value
        LIMIT %s
        """,
        (embedding, limit),
    )


def delete_all_notes() -> int:
    return db.execute_delete("DELETE FROM notes")
