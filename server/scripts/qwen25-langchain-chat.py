"""
Chat com Ollama usando Langchain

Modelo: qwen2.5:1.5b
"""

from dotenv import load_dotenv
load_dotenv()

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage

# Criar o modelo Ollama
llm = ChatOllama(
    model="qwen2.5:1.5b",
    temperature=0.2,
)

# Prompt com system e histórico
prompt = ChatPromptTemplate.from_messages([
    ("system", "Você é um assistente prestativo e objetivo."),
    MessagesPlaceholder(variable_name="history"),
    ("user", "{input}")
])

# Chain base
chain = prompt | llm

# "Banco de memória" em RAM (pra demo)
# Em produção, você pode persistir no banco ou Redis
_store: dict[str, InMemoryChatMessageHistory] = {}


def get_history(session_id: str) -> InMemoryChatMessageHistory:
    """Retorna ou cria o histórico para uma sessão"""
    if session_id not in _store:
        _store[session_id] = InMemoryChatMessageHistory()
    return _store[session_id]


def run_chat():
    """Executa o chat interativo"""
    print("=" * 50)
    print("Chat com Qwen2.5 (Langchain + Ollama)")
    print("Digite 'exit' ou 'quit' para sair")
    print("Digite 'new' para mudar de sessão")
    print("Digite 'clear' para limpar o histórico")
    print("=" * 50)

    session_id = "sessao-1"

    print(f"\nSessão atual: {session_id}")

    while True:
        user_input = input("\nYou: ")

        if user_input.lower() in ['exit', 'quit']:
            print("Encerrando chat...")
            break

        if user_input.lower() == 'new':
            session_id = input("Nova sessão: ").strip() or "nova-sessao"
            print(f"Trocou para sessão: {session_id}")
            continue

        if user_input.lower() == 'clear':
            if session_id in _store:
                _store[session_id].clear()
            print("Histórico limpo!")
            continue

        if not user_input.strip():
            continue

        try:
            # Obter histórico da sessão
            history = get_history(session_id)

            # Converter histórico para formato Langchain
            history_messages = history.messages

            # Invocar a chain com histórico
            response = chain.invoke({
                "input": user_input,
                "history": history_messages
            })

            print(f"AI: {response.content}")

            # Salvar no histórico
            history.add_user_message(user_input)
            history.add_ai_message(response.content)

        except Exception as e:
            print(f"Erro: {e}")


if __name__ == "__main__":
    run_chat()
