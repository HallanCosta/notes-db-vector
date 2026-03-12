"""
Business logic layer for chat operations with AI (LangChain + MiniMax).
"""
import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.chat_history import InMemoryChatMessageHistory
from database import db
from models import ChatMessage

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


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
            total = len(notes)
            return f"Total de notas no sistema: {total}"
        else:
            return f"Erro na API: {response.status_code}"

    except Exception as e:
        return f"Erro ao contar notas: {str(e)}"


def normalize_args(tool_args: dict) -> dict:
    """Normaliza args de diferentes formatos de LLM."""
    if 'parameters' in tool_args:
        return tool_args['parameters']
    return {k: v for k, v in tool_args.items() if k not in ('function', 'name')}


# Lista de ferramentas disponíveis
tools = [search_notes, get_all_notes, count_notes]

# Configuração do MiniMax
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")

# LLM com binding de tools
llm = ChatOpenAI(
    model="MiniMax-M2.5",
    api_key=MINIMAX_API_KEY,
    base_url="https://api.minimax.io/v1",
    temperature=1.0,
).bind_tools(tools)

# Armazenamento em memória por sessão
_store: Dict[str, InMemoryChatMessageHistory] = {}


class ChatService:
    """Service class for chat operations."""

    @staticmethod
    def get_history(session_id: str = "default") -> InMemoryChatMessageHistory:
        """Retorna ou cria o histórico para uma sessão."""
        if session_id not in _store:
            _store[session_id] = InMemoryChatMessageHistory()
        return _store[session_id]

    @staticmethod
    def save_message_to_db(session_id: str, role: str, content: str) -> Dict[str, Any]:
        """Salva mensagem no banco de dados."""
        query = """
            INSERT INTO chat_messages (session_id, role, content)
            VALUES (%s, %s, %s)
            RETURNING id, session_id, role, content, created_at
        """
        return db.execute_with_return(query, (session_id, role, content))

    @staticmethod
    def get_messages_from_db(session_id: str = "default", limit: int = 50) -> List[Dict[str, Any]]:
        """Busca mensagens do banco de dados."""
        query = """
            SELECT id, session_id, role, content, created_at
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC
            LIMIT %s
        """
        return db.execute_query(query, (session_id, limit))

    @staticmethod
    def process_message(message: str, session_id: str = "default") -> Dict[str, Any]:
        """Processa mensagem do usuário e retorna resposta da AI."""
        # Salva mensagem do usuário no banco
        ChatService.save_message_to_db(session_id, "user", message)

        # Obtém histórico da sessão
        history = ChatService.get_history(session_id)

        # Invoca o LLM diretamente (igual ao script minimax-langchain-chat.py)
        response = llm.invoke(message)

        # Verifica se o LLM chamou alguma ferramenta
        final_content = response.content

        if hasattr(response, 'tool_calls') and response.tool_calls:
            for tool_call in response.tool_calls:
                tool_name = tool_call['name']
                tool_args = normalize_args(tool_call['args'])

                # Executa a ferramenta
                if tool_name == 'search_notes':
                    result = search_notes.invoke(tool_args)
                elif tool_name == 'get_all_notes':
                    result = get_all_notes.invoke(tool_args)
                elif tool_name == 'count_notes':
                    result = count_notes.invoke(tool_args)
                else:
                    result = "Ferramenta desconhecida"

                # Adiciona ao histórico
                history.add_user_message(message)
                history.add_ai_message(response.content)

                # Chama novamente com o resultado da ferramenta (sem chain para não re-triggerar tools)
                context_prompt = f"""Pergunta original: {message}

Resultado da ferramenta {tool_name}: {result}

Com base no resultado acima, responda ao usuário de forma clara e útil."""

                final_response = llm.invoke(context_prompt)
                final_content = final_response.content

                history.add_ai_message(final_content)

        # Adiciona ao histórico
        history.add_user_message(message)
        history.add_ai_message(final_content)

        # Salva resposta da AI no banco
        ChatService.save_message_to_db(session_id, "assistant", final_content)

        return {
            "user_message": ChatMessage(role="user", content=message),
            "assistant_message": ChatMessage(role="assistant", content=final_content)
        }

    @staticmethod
    def clear_history(session_id: str = "default"):
        """Limpa o histórico da sessão."""
        if session_id in _store:
            _store[session_id].clear()

    @staticmethod
    def delete_session_messages(session_id: str = "default"):
        """Deleta todas as mensagens da sessão do banco."""
        query = "DELETE FROM chat_messages WHERE session_id = %s"
        db.execute_delete(query, (session_id,))
