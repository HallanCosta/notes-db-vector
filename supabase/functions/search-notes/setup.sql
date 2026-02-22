-- Função RPC para buscar notas por similaridade vetorial
-- Chamada: POST /rest/v1/rpc/match_notes

CREATE OR REPLACE FUNCTION match_notes(
    query_embedding vector(768),
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    created_at timestamp with time zone,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        notes.id,
        notes.title,
        notes.content,
        notes.created_at,
        1 - (notes.embedding <=> query_embedding) AS similarity
    FROM notes
    ORDER BY notes.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
