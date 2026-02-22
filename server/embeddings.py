"""
Configuração de embeddings - OpenAI ou Ollama
"""
import os
from enum import Enum
from typing import List
import requests
from dotenv import load_dotenv

load_dotenv(override=True)


class EmbeddingProvider(str, Enum):
    """Provedores de embedding disponíveis"""
    OPENAI = "openai"
    OLLAMA = "ollama"


def get_embedding_provider() -> EmbeddingProvider:
    """Retorna o provider configurado"""
    provider = os.getenv("EMBEDDING_PROVIDER", "openai").lower()
    print(f"[DEBUG] EMBEDDING_PROVIDER env var: {provider}")
    if provider == "ollama":
        return EmbeddingProvider.OLLAMA
    return EmbeddingProvider.OPENAI


def generate_embedding(text: str) -> List[float]:
    """
    Gera embedding usando o provider configurado.
    """
    provider = get_embedding_provider()
    print(f"[DEBUG] Using embedding provider: {provider}")
    
    if provider == EmbeddingProvider.OPENAI:
        return _generate_openai_embedding(text)
    elif provider == EmbeddingProvider.OLLAMA:
        return _generate_ollama_embedding(text)
    
    return _generate_openai_embedding(text)


def _generate_openai_embedding(text: str) -> List[float]:
    """Gera embedding usando OpenAI"""
    from openai import OpenAI
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    
    return response.data[0].embedding


def _generate_ollama_embedding(text: str) -> List[float]:
    """
    Gera embedding usando Ollama local (nomic-embed-text).
    """
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
    
    url = f"{ollama_url}/api/embeddings"
    
    payload = {
        "model": model,
        "prompt": text
    }
    
    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    
    if "embedding" in result:
        return result["embedding"]
    
    raise ValueError(f"Formato de resposta não reconhecido do Ollama: {result}")
