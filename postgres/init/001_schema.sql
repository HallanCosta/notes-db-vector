-- Schema compartilhado pelo modo local FastAPI + PostgreSQL/pgvector.
-- A migration equivalente continua em supabase/migrations/ para o modo Supabase.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    embedding halfvec(2560) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_embedding_idx
ON notes
USING hnsw (embedding halfvec_cosine_ops);

CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL DEFAULT 'default',
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx
ON chat_messages (session_id, created_at);
