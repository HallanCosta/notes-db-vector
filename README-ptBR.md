# Notes CRUD - Busca Vetorial

[🇺🇸 Read this README in English](https://github.com/HallanCosta/notes-db-vector/blob/main/README.md)

Aplicação de notas com busca semântica usando React, PostgreSQL/pgvector e Ollama.

## Screenshots

### Workspace de notas

![Workspace de notas](designs/notes.png)

### Chat AI

![Chat AI](designs/chat-ai.png)

O projeto possui dois modos de backend, selecionados no frontend por
`VITE_BACKEND_MODE`:

- `fastapi`: modo local leve, com FastAPI, PostgreSQL + pgvector e Ollama.
- `supabase`: modo compatível com as Edge Functions e o Realtime existentes.

## Requisitos

- [Docker](https://www.docker.com)
- Node.js + pnpm
- [Supabase CLI](https://supabase.com/docs/guides/cli) apenas para o modo Supabase

---

## Instalação do Supabase CLI

```bash
# Download
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz

# Mover para PATH
sudo mv supabase /usr/local/bin/

# Verificar instalação
supabase --version
```

---

## Subindo o ambiente local leve (FastAPI)

Na raiz do projeto, suba todo o ambiente local com um único comando:

```bash
bash scripts/start-fastapi.sh
```

O script inicia PostgreSQL/pgvector, Ollama, FastAPI e o frontend. Ele também
garante que o modelo `qwen3-embedding:4b` esteja disponível. Configure
`server/.env` com `GROQ_API_KEY` antes de iniciar o chat.

Acesse a aplicação em `http://localhost:5173`, a API em
`http://127.0.0.1:8003` e a documentação em `http://127.0.0.1:8003/docs`.
Pressione `Ctrl+C` para desligar os serviços FastAPI iniciados pelo script.

Se precisar somente dos serviços do backend em segundo plano, use:

```bash
docker compose up -d postgres ollama server
docker exec notes-ollama ollama pull qwen3-embedding:4b
```

O banco local é inicializado automaticamente por
`postgres/init/001_schema.sql`. Os dados ficam persistidos em
`.docker/postgres_data`.

### Modo Supabase preservado

O Supabase continua disponível como um modo opcional separado. Use-o somente
quando precisar do fluxo com Edge Functions e Realtime; não execute os dois
scripts de inicialização ao mesmo tempo:

```bash
bash scripts/start-supabase.sh
```

Os scripts desligam os serviços do modo escolhido quando você pressiona `Ctrl+C`.
O script Supabase não carrega automaticamente `supabase/.env`, evitando misturar
credenciais remotas com o ambiente local.

### Configuração do Chat AI com Groq

O chat usa um provedor compatível com a API da OpenAI. Para usar o Groq, copie o
arquivo de exemplo e configure a chave somente no backend:

```bash
cp server/.env.example server/.env
```

Mantendo a estrutura atual, preencha a chave no arquivo `server/.env`:

```env
GROQ_API_KEY=sua_chave_groq
```

A chave não deve ser colocada no frontend, commitada ou incluída em logs. Quando
`CHAT_PROVIDER` não for definido, o endpoint oficial OpenAI-compatible do Groq e
o modelo `qwen/qwen3.8-27b` são usados automaticamente. Eles podem ser
substituídos com `CHAT_PROVIDER` e `GROQ_MODEL`. Para uma configuração legada
com MiniMax, defina `CHAT_PROVIDER=minimax` e forneça
`MINIMAX_API_KEY`/`MINIMAX_MODEL`.

Se o provedor estiver indisponível, a interface mantém a mensagem enviada e
exibe: “Não consegui me conectar com o assistente. Verifique a conexão e tente
novamente.”

Os endpoints do modo FastAPI são:

- **API:** http://127.0.0.1:8003
- **Documentação:** http://127.0.0.1:8003/docs

### Frontend somente (manual)

```bash
cd web
pnpm install
VITE_BACKEND_MODE=fastapi pnpm dev
```

Acesse: http://localhost:5173

### Testes do Frontend

```bash
cd web

# Rodar testes unitários (exclui testes de integração)
pnpm test:run

# Rodar testes com coverage
pnpm test:coverage

# Rodar todos os testes incluindo integração (requer Supabase rodando)
pnpm test:integration
```

- **Testes unitários:** Usam mocks, sem dependências externas
- **Testes de integração:** Fazem chamadas HTTP reais para as Edge Functions do Supabase

---

## Scripts

Os seeders usam a fixture compartilhada
`scripts/data/notes_pt_br.json` e geram embeddings reais com o Qwen no Ollama.
O mesmo comando possui adaptadores para o FastAPI e para as Edge Functions do
Supabase, sem remover o fluxo legado.

### Seed de notas em português

Inicie o modo FastAPI antes do seed:

```bash
docker compose up -d postgres ollama server
docker exec notes-ollama ollama pull qwen3-embedding:4b
```

Popule o PostgreSQL/pgvector local:

```bash
# Insere 36 notas em português, prefixadas com [seed:pt-br]
bash scripts/seed_notes_fastapi.sh --reset

# Forma equivalente, com opções adicionais do script Python
python3 scripts/seed_notes.py --backend fastapi --reset

# Remove somente as notas da fixture, sem apagar notas do usuário
bash scripts/seed_notes_fastapi.sh --cleanup
```

Para o modo Supabase preservado, depois de iniciar o Supabase local e as Edge
Functions, use o mesmo dataset pelo adaptador existente:

```bash
# O script chama scripts/seed_notes.py --backend supabase
bash scripts/seed_notes_br.sh --reset
bash scripts/seed_notes_br.sh --cleanup
```

O fixture legado do Supabase em inglês também está disponível:

```bash
bash scripts/seed_notes_en.sh
```

O prefixo evita misturar dados de teste com notas manuais. Ele pode ser alterado
sem perder a limpeza segura:

```bash
python3 scripts/seed_notes.py --backend fastapi --prefix "[e2e:pt-br]" --reset
python3 scripts/seed_notes.py --backend fastapi --prefix "[e2e:pt-br]" --cleanup
```

Em caso de erro durante a inserção, o script remove automaticamente os IDs
criados naquela execução. O modo FastAPI também expõe `DELETE /notes/{id}` para
que os testes possam limpar cada nota sem usar o endpoint destrutivo de apagar
todas.

### E2E de busca semântica

Com PostgreSQL, Ollama/Qwen e FastAPI disponíveis em `127.0.0.1:8003`, rode:

```bash
cd web
pnpm test:e2e
```

O Playwright inicia o Vite quando necessário, executa o seed da fixture, testa
consultas em português sobre Pix, boleto e carbonara, valida o primeiro
resultado do ranking e limpa as notas ao final. Para outra API FastAPI:

```bash
E2E_API_URL=http://127.0.0.1:8003 pnpm test:e2e
```

O teste precisa do modelo local:

```bash
docker exec notes-ollama ollama pull qwen3-embedding:4b
```

### Deletar todas as notas

```bash
bash scripts/delete_all_notes.sh
```

### Rodar testes (Edge Functions do Supabase)

Requer o [Deno](https://deno.land/) instalado.

```bash
cd supabase

# Rodar testes uma vez
deno task test:run

# Rodar testes com coverage
deno task test:coverage

# Rodar testes de integração (requer Supabase e Ollama rodando)
deno task test:integration
```

### Scripts Python (Embedding & Chat)

Scripts de teste para embeddings e chat com Langchain. Localizados em
`server/scripts/`.

```bash
# Chat com Qwen2.5 usando Langchain
server/venv/bin/python3 server/scripts/qwen25-langchain-chat.py

# Gerar embeddings com Ollama (qwen3-embedding)
server/venv/bin/python3 server/scripts/qwen3-langchain-embedding.py

# Gerar embeddings com Gemini
server/venv/bin/python3 server/scripts/gemini-api-embedding.py

# Gerar embeddings com MiniMax
server/venv/bin/python3 server/scripts/minimax-embedding.py
```

---

## Tipos de Dados Vetoriais (pgvector)

O pgvector suporta diferentes tipos para armazenar embeddings:

| Tipo | Limite de Dimensões | Uso Recomendado |
|------|---------------------|-----------------|
| `vector` | até 2.000 | Embeddings pequenos (OpenAI, nomic-embed-text) |
| `halfvec` | até 4.000 | Embeddings grandes (qwen3-embedding:4b com 2560 dim) |
| `bit` | até 64.000 | Busca binária (alta velocidade) |

### Diferenças de Memória e Performance

- **vector**: Precisão total (32-bit float), mais memória
- **halfvec**: Metade da precisão (16-bit float), ~50% menos memória
- **bit**: 1 bit por dimensão, menor ainda, mas perde precisão

### Alterando o Tipo da Coluna

```sql
-- Para usar embeddings de 2560 dimensões (ex: qwen3-embedding)
ALTER TABLE notes ALTER COLUMN embedding TYPE halfvec(2560);
CREATE INDEX notes_embedding_idx ON notes USING hnsw (embedding halfvec_cosine_ops);
```

---

## Busca Vetorial

As notas são pesquisadas por **similaridade semântica** — não precisa digitar a palavra exata. O modelo entende o contexto e retorna apenas notas relacionadas ao assunto buscado.

Por exemplo, buscar por termos de fintech retorna apenas notas financeiras, sem misturar com notas de filmes ou receitas que também existem no banco.

### Palavras para testar (seed em português)

**Pagamentos e transferências:**
- `banco central` → notas sobre Pix, SPI, regulação
- `split payment` → notas sobre Pix, TED, transferências
- `random key` → notas sobre cadastro de chaves Pix
- `barcode` → notas sobre boleto bancário

> **Nota:** A pasta `server/` implementa o modo local FastAPI. A pasta `supabase/`
> continua implementando o modo alternativo com Edge Functions e Realtime.

---

## Estrutura

```
postgres/init/
  001_schema.sql # Schema local com PostgreSQL + pgvector
server/
  main.py       # API FastAPI para o modo local
  notes_service.py # CRUD, busca vetorial e embeddings Ollama
supabase/
  migrations/   # Schema equivalente para o modo Supabase
  functions/    # Edge Functions preservadas
web/
  src/          # Frontend React + TypeScript
scripts/        # Scripts legados que usam o modo Supabase
```

---

## Tecnologias

- **Backend local:** FastAPI + PostgreSQL/pgvector
- **Backend alternativo:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Embeddings:** Ollama (`qwen3-embedding:4b`, 2560 dimensões)
- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Ícones:** Lucide React

---

## 👨‍💻 Contribuidores

|Autor|
|--|
|[<img src="https://github.com/hallancosta.png" width="115"><br><div align="center"><sub>@HallanCosta</sub></div>](https://github.com/hallancosta)|

⭐ Se este projeto te ajudar, considere dar uma estrela no repo!
