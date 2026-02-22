-- Habilitar extensão pgvector
create extension if not exists vector;

-- Tabela de notas
create table if not exists notes (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    embedding vector(768) not null,
    created_at timestamp with time zone default now()
);

-- Índice para busca por similaridade
create index if not exists notes_embedding_idx
on notes
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Função RPC para busca vetorial
create or replace function match_notes(
    query_embedding vector(768),
    match_count int default 10
)
returns table (
    id uuid,
    title text,
    content text,
    created_at timestamp with time zone,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        notes.id,
        notes.title,
        notes.content,
        notes.created_at,
        1 - (notes.embedding <=> query_embedding) as similarity
    from notes
    order by notes.embedding <=> query_embedding
    limit match_count;
end;
$$;
