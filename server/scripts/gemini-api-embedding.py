"""
Teste de embedding com Google Gemini (gemini-embedding-001)

Modelo gratuito:
- Dimensões: 768
- Camada gratuita: 60 req/min, 1500 req/dia

Como usar:
1. Criar API key: https://aistudio.google.com/app/apikey
2. Exportar a chave: export GEMINI_API_KEY="sua-chave"
"""

import google.generativeai as genai
import os


def get_embedding(text: str) -> list:
    """
    Gera embedding para o texto usando o modelo gemini-embedding-001.

    Args:
        text: Texto para gerar embedding

    Returns:
        Lista de floats representando o embedding (768 dimensões)
    """
    result = genai.embed_content(
        model="gemini-embedding-001",
        content=text,
        task_type="retrieval_document"
    )
    return result["embedding"]


def main():
    # Configurar API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Erro: Defina a variável de ambiente GEMINI_API_KEY")
        print("Exemplo: export GEMINI_API_KEY='sua-chave-aqui'")
        return

    genai.configure(api_key=api_key)

    # Teste com texto de exemplo
    text = "Hello, world! This is a test of Gemini embedding."

    print(f"Texto de entrada: {text}")
    print("Gerando embedding...")

    embedding = get_embedding(text)

    print(f"Dimensões do embedding: {len(embedding)}")
    print(f"Primeiros 5 valores: {embedding[:5]}")
    print("\nEmbedding gerado com sucesso!")


if __name__ == "__main__":
    main()
