# Notes CRUD - Busca Vetorial

[🇺🇸 Read this README in English](https://github.com/HallanCosta/notes-db-vector/blob/main/README.md)

Aplicação de notas com busca semântica usando Supabase, Ollama e React.

## Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker](https://www.docker.com)
- Node.js + pnpm

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

## Subindo o ambiente

### 1. Ollama (Docker)

```bash
docker compose up -d
```

Isso sobe o Ollama na porta `11434`. Depois instale o modelo de embeddings:

```bash
docker exec -it notes-ollama ollama pull nomic-embed-text
```

### 2. Supabase local

```bash
# Subir os serviços
supabase start

# Criar as tabelas via migrations
supabase db reset
```

### 3. Edge Functions

Crie o arquivo `supabase/.env` com o host do Ollama:

```env
OLLAMA_URL=http://host.docker.internal:11434
```

Rode as edge functions:

```bash
supabase functions serve --env-file supabase/.env
```

Após iniciar, você pode acessar:

- **Dashboard do Supabase (inclui Edge Functions):** http://127.0.0.1:54323/project/default/functions
- **URL da API:** http://127.0.0.1:54321

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

### 4. Frontend

```bash
cd web
pnpm install
pnpm dev
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

Os scripts ficam na pasta `scripts/` e precisam do Supabase e Ollama rodando.

### Seed de dados

Popula o banco com notas e embeddings reais gerados pelo Ollama.

```bash
# Notas em inglês
bash scripts/seed_notes_en.sh

# Notas em português
# bash scripts/seed_notes_br.sh
```

### Deletar todas as notas

```bash
bash scripts/delete_all_notes.sh
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

> **Nota:** A pasta `server/` não está sendo usada. Era uma versão em Python que integrava com o pgvector no Docker. Atualmente, este projeto usa Supabase (PostgreSQL + pgvector) em vez disso.

---

## Estrutura

```
supabase/
  migrations/   # Criação das tabelas, extensão pgvector e função match_notes
  functions/    # Edge functions (create-note, get-notes, search-notes...)
  .env          # Variáveis de ambiente das edge functions
web/
  src/          # Frontend React + TypeScript
  .env          # Variáveis de ambiente do frontend
scripts/
  seed_notes_br.sh          # Seed com notas em português
  seed_notes_en.sh          # Seed com notas em inglês (particularmente o modelo usado se sai melhor com notas inglês)
  delete_all_notes.sh # Deleta todas as notas do banco
```

---

## Tecnologias

- **Backend:** Supabase (PostgreSQL + pgvector)
- **Edge Functions:** Deno (Supabase Edge Functions)
- **Embeddings:** Ollama (nomic-embed-text)
- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Ícones:** Lucide React

---

## 👨‍💻 Contribuidores

|Autor|
|--|
|[<img src="https://github.com/hallancosta.png" width="115"><br><div align="center"><sub>@HallanCosta</sub></div>](https://github.com/hallancosta)|

⭐ Se este projeto te ajudar, considere dar uma estrela no repo!
