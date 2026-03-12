"""
Chat com MiniMax usando LangChain (OpenAI-compatible API)

Modelo: MiniMax-M2.5
Suporta busca semântica por notas do Supabase usando:
- LangChain Tools (LLM decide quando buscar)
- InMemoryChatMessageHistory (histórico de chat)
"""

import os
import requests
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.chat_history import InMemoryChatMessageHistory

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Configurações do MiniMax
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"


# ============================================================
# FERRAMENTAS (TOOLS) - O LLM Decide quando usar
# ============================================================

@tool
def search_notes(query: str) -> str:
    """
    Busca notas por similaridade semântica no banco de dados.

    Use esta ferramenta quando o usuário:
    - Pedir para buscar, procurar ou pesquisar notas
    - Perguntar sobre notas relacionadas a um tema
    - Quiser encontrar notas sobre algo específico

    Args:
        query: Texto de busca (pode ser em português ou inglês)

    Returns:
        String formatada com as notas encontradas
    """
    try:
        url = f"{SUPABASE_URL}/functions/v1/search-notes"
        params = {"q": query}

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

        response = requests.get(url, params=params, headers=headers, timeout=30)

        if response.status_code == 200:
            notes = response.json()
            if not notes:
                return "Nenhuma nota encontrada para a consulta."

            formatted = []
            for i, note in enumerate(notes, 1):
                title = note.get("title", "Sem título")
                content = note.get("content", "")

                if len(content) > 500:
                    content = content[:500] + "..."

                formatted.append(f"Nota {i}: {title}\n{content}")

            return "\n\n".join(formatted)

        return f"Erro na API: {response.status_code}"

    except Exception as e:
        return f"Erro ao buscar notas: {str(e)}"


@tool
def get_all_notes(limit: int = 50) -> str:
    """
    Lista todas as notas do banco de dados.

    Use esta ferramenta quando o usuário:
    - Pedir para listar todas as notas
    - Perguntar quantas notas existem
    - Quiser ver todas as notas disponíveis

    Args:
        limit: Número máximo de notas a retornar (padrão: 50)

    Returns:
        String formatada com todas as notas
    """
    try:
        url = f"{SUPABASE_URL}/rest/v1/notes"
        params = {
            "select": "id,title,content,created_at",
            "limit": limit,
            "order": "created_at.desc"
        }

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

        response = requests.get(url, params=params, headers=headers, timeout=30)

        if response.status_code == 200:
            notes = response.json()
            if not notes:
                return "Nenhuma nota encontrada no sistema."

            total = len(notes)
            formatted = [f"Total de notas: {total}\n"]

            for i, note in enumerate(notes, 1):
                title = note.get("title", "Sem título")
                content = note.get("content", "")
                created = note.get("created_at", "")[:10]

                if len(content) > 150:
                    content = content[:150] + "..."

                formatted.append(f"\nNota {i}: {title} ({created})")
                if content:
                    formatted.append(content)

            return "\n".join(formatted)

        return f"Erro na API: {response.status_code}"

    except Exception as e:
        return f"Erro ao buscar notas: {str(e)}"


@tool
def count_notes() -> str:
    """
    Conta o número total de notas no sistema.

    Use esta ferramenta quando o usuário:
    - Perguntar quantas notas existem
    - Quiser saber o total de notas
    """
    try:
        url = f"{SUPABASE_URL}/rest/v1/notes"
        params = {"select": "id", "limit": 1000}

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

        response = requests.get(url, params=params, headers=headers, timeout=30)

        if response.status_code == 200:
            notes = response.json()
            return f"Total de notas no sistema: {len(notes)}"
        return f"Erro na API: {response.status_code}"

    except Exception as e:
        return f"Erro ao contar notas: {str(e)}"


# Lista de ferramentas disponíveis
tools = [search_notes, get_all_notes, count_notes]


# ============================================================
# CONFIGURAÇÃO DO LLM COM TOOLS
# ============================================================

llm = ChatOpenAI(
    model="MiniMax-M2.5",
    api_key=MINIMAX_API_KEY,
    base_url=MINIMAX_BASE_URL,
    temperature=1.0,
).bind_tools(tools)


# ============================================================
# MEMÓRIA DE CONVERSA
# ============================================================

_store: dict[str, InMemoryChatMessageHistory] = {}


def get_history(session_id: str = "default") -> InMemoryChatMessageHistory:
    """Retorna ou cria o histórico para uma sessão"""
    if session_id not in _store:
        _store[session_id] = InMemoryChatMessageHistory()
    return _store[session_id]


def get_chat_history():
    """Retorna o histórico de mensagens"""
    history = get_history()
    return history.messages


def clear_history():
    """Limpa o histórico"""
    _store.clear()


# ============================================================
# CHAT INTERATIVO
# ============================================================

def run_chat():
    """Executa o chat interativo"""
    print("=" * 60)
    print("Chat com MiniMax (LangChain) - MiniMax-M2.5")
    print("Ferramentas disponíveis:")
    print("  - search_notes: Buscar notas por similaridade")
    print("  - get_all_notes: Listar todas as notas")
    print("  - count_notes: Contar notas")
    print("\nComandos:")
    print("  'exit' ou 'quit' - Sair")
    print("  'clear' - Limpar histórico")
    print("  'history' - Ver histórico")
    print("=" * 60)

    while True:
        user_input = input("\nYou: ").strip()

        if not user_input:
            continue

        if user_input.lower() in ['exit', 'quit']:
            print("Encerrando chat...")
            break

        if user_input.lower() == 'clear':
            clear_history()
            print("Histórico limpo!")
            continue

        if user_input.lower() == 'history':
            history = get_chat_history()
            print(f"\nHistórico ({len(history)} mensagens):")
            for i, msg in enumerate(history):
                print(f"  {i+1}. {type(msg).__name__}: {msg.content[:50]}...")
            continue

        try:
            history = get_history()

            response = llm.invoke(user_input)

            if hasattr(response, 'tool_calls') and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call['name']
                    tool_args = tool_call['args']

                    print(f"\n  [Tool: {tool_name}]")
                    print(f"  [Args: {tool_args}]")

                    if tool_name == 'search_notes':
                        result = search_notes.invoke(tool_args)
                    elif tool_name == 'get_all_notes':
                        result = get_all_notes.invoke(tool_args)
                    elif tool_name == 'count_notes':
                        result = count_notes.invoke(tool_args)
                    else:
                        result = "Ferramenta desconhecida"

                    print(f"  [Resultado: {str(result)[:100]}...]")

                    history.add_user_message(user_input)
                    history.add_ai_message(response.content)

                    context_prompt = f"""Pergunta original: {user_input}

Resultado da ferramenta {tool_name}: {result}

Com base no resultado acima, responda ao usuário de forma clara e útil."""

                    final_response = llm.invoke(context_prompt)
                    print(f"\nAI: {final_response.content}")

                    history.add_ai_message(final_response.content)
            else:
                print(f"\nAI: {response.content}")
                history.add_user_message(user_input)
                history.add_ai_message(response.content)

        except Exception as e:
            print(f"Erro: {e}")


if __name__ == "__main__":
    run_chat()
