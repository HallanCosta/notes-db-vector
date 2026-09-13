import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

# Embed single text
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

query = "The meaning of life is 42"
query_embedding = embeddings.embed_query(query)
print(f"Query: {query}")
print(f"Embedding: {query_embedding[:5]}... (dimension: {len(query_embedding)})")

# Embed multiple texts
documents = ["This is a test query1.", "Esta é uma consulta em português."]
doc_embeddings = embeddings.embed_documents(documents)
print(f"\nDocuments: {documents}")
print(f"Embeddings: {[e[:5] for e in doc_embeddings]}")
