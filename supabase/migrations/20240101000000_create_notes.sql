-- Habilitar extensão pgvector
create extension if not exists vector;

-- Tabela de notas (usando halfvec para suportar até 4096 dimensões)
create table if not exists notes (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    embedding halfvec(2560) not null,
    created_at timestamp with time zone default now()
);

-- Índice para busca por similaridade (HNSW é mais rápido que IVFFlat)
create index if not exists notes_embedding_idx
on notes
using hnsw (embedding halfvec_cosine_ops);

-- Função RPC para busca vetorial
create or replace function match_notes(
    query_embedding halfvec(2560),
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
