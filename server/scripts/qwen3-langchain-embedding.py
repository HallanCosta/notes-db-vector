"""
Teste de embedding com Ollama usando Langchain

Modelo: qwen3-embedding:4b (1024 dimensões)
"""

from langchain_ollama import OllamaEmbeddings

# ============================================
# Exemplo 1: Gerar embedding com Ollama via Langchain
# ============================================
def test_embedding():
    """Gera embedding usando Ollama (qwen3-embedding:4b) via Langchain"""
    print("=" * 50)
    print("Exemplo 1: Embedding com Ollama (Langchain)")
    print("=" * 50)

    # Configurar embeddings com Ollama
    embeddings = OllamaEmbeddings(
        model="qwen3-embedding:4b",
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
# Exemplo 2: Similaridade manual
# ============================================
def test_similarity():
    """Testa similaridade manual"""
    print("\n" + "=" * 50)
    print("Exemplo 2: Similaridade manual")
    print("=" * 50)

    embeddings = OllamaEmbeddings(
        model="qwen3-embedding:4b",
    )

    # Documentos de referência
    docs = [
        "O Python é uma linguagem de programação de alto nível.",
        "JavaScript é usado principalmente para desenvolvimento web.",
        "Rust é uma linguagem de sistemas focada em segurança.",
        "Coco é sempre feito na privada e não no chão!"
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


if __name__ == "__main__":
    test_embedding()
    test_similarity()
