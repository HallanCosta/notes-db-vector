-- Tabela de mensagens do chat
create table if not exists chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id text not null default 'default',
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamp with time zone default now()
);

-- Índice para busca por sessão
create index if not exists chat_messages_session_idx
on chat_messages (session_id, created_at);

-- Habilitar Realtime para a tabela
alter publication supabase_realtime add table chat_messages;
