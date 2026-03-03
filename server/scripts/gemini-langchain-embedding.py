"""
Teste de embedding com Google Gemini usando Langchain

Modelos gratuitos:
- gemini-embedding-001 (3072 dimensões)
- Camada gratuita: 60 req/min, 1500 req/dia
"""

import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Configurar API key
api_key = "AIzaSyDSjfj7ppGO28TGnxuc2YmkhiQFQxBn1MQ"
if not api_key:
    print("Erro: Defina a variável de ambiente GEMINI_API_KEY")
    print("Exemplo: export GEMINI_API_KEY='sua-chave-aqui'")
    exit(1)


# ============================================
# Exemplo 1: Gerar embedding direto com Langchain
# ============================================
def test_embedding():
    """Gera embedding usando Gemini via Langchain"""
    print("=" * 50)
    print("Exemplo 1: Embedding com Langchain")
    print("=" * 50)

    # Configurar embeddings (igual à API direta, mas via Langchain)
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=api_key
    )

    # Embed de uma query
    text = "Olá, este é um teste de embedding em português!"

    result = embeddings.embed_query(text)

    print(f"Texto: {text}")
    print(f"Dimensões: {len(result)}")
    print(f"Primeiros 5 valores: {result[:5]}")
    print()

    # Embed de múltiplos textos
    texts = [
        "Python é uma linguagem de programação.",
        "JavaScript é usado para desenvolvimento web.",
        "Rust é focado em segurança e performance."
    ]

    results = embeddings.embed_documents(texts)

    print(f"Embedding de {len(results)} documentos:")
    for i, emb in enumerate(results):
        print(f"  Doc {i+1}: {len(emb)} dimensões")


# ============================================
# Exemplo 2: similarity_search (sem vectorstore)
# ============================================
def test_similarity():
    """Testa similaridade manual"""
    print("\n" + "=" * 50)
    print("Exemplo 2: Similaridade manual")
    print("=" * 50)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=api_key
    )

    # Documentos de referência
    docs = [
        "O Python é uma linguagem de programação de alto nível.",
        "JavaScript é usado principalmente para desenvolvimento web.",
        "Rust é uma linguagem de sistemas focada em segurança.",
    ]

    # Embed dos documentos
    doc_embeddings = embeddings.embed_documents(docs)

    # Query
    query = "linguagem de programação segura"
    query_embedding = embeddings.embed_query(query)

    # Calcular similaridade (cosine similarity manual)
    from numpy import dot
    from numpy.linalg import norm

    def cosine_similarity(a, b):
        return dot(a, b) / (norm(a) * norm(b))

    print(f"Query: {query}")
    print("\nSimilaridades:")
    similarities = []
    for i, doc_emb in enumerate(doc_embeddings):
        sim = cosine_similarity(query_embedding, doc_emb)
        similarities.append((i, sim, docs[i]))
        print(f"  {i+1}. {docs[i][:50]}... -> {sim:.4f}")

    # Ordenar por similaridade
    similarities.sort(key=lambda x: x[1], reverse=True)
    print(f"\nMais similar: {similarities[0][2]}")


# ============================================
# Exemplo 3: Usar com Chat (LLM)
# ============================================
def test_chat():
    """Testa chat com Gemini via Langchain"""
    print("\n" + "=" * 50)
    print("Exemplo 3: Chat com Gemini (LLM)")
    print("=" * 50)

    from langchain_google_genai import ChatGoogleGenerativeAI

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        api_key=api_key
    )

    response = llm.invoke("Qual é a capital do Brasil?")

    print(f"Pergunta: Qual é a capital do Brasil?")
    print(f"Resposta: {response.content}")


if __name__ == "__main__":
    # test_embedding()
    # test_similarity()
    test_chat()
