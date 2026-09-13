"""
FastAPI application for Chat AI with Notes.
"""
from typing import List
from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import ChatRequest, ChatResponse, Note, NoteCreate
from chat_service import ChatService
from notes_service import create_note, delete_all_notes, delete_note, get_note, list_notes, search_notes

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Notes Chat API",
    description="API de chat com AI para gerenciamento de notas usando LangChain + Ollama",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {"message": "Server is running..."}


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ============================================================
# Notes Endpoints - modo direto PostgreSQL + pgvector
# ============================================================

@app.get("/notes", response_model=List[Note], tags=["Notes"])
async def get_notes(limit: int = Query(100, ge=1, le=1000)):
    """List notes directly from PostgreSQL."""
    try:
        return list_notes(limit)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar notas: {error}",
        )


@app.get("/notes/search", response_model=List[Note], tags=["Notes"])
async def find_notes(
    q: str = Query(..., min_length=1, description="Texto da busca semântica"),
    limit: int = Query(6, ge=1, le=100),
):
    """Search notes with pgvector after embedding the query in Ollama."""
    try:
        return search_notes(q, limit)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na busca vetorial: {error}",
        )


@app.get("/notes/{note_id}", response_model=Note, tags=["Notes"])
async def find_note(note_id: str):
    """Get one note by ID."""
    try:
        note = get_note(note_id)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar nota: {error}",
        )
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota não encontrada")
    return note


@app.delete("/notes/{note_id}", tags=["Notes"])
async def remove_note(note_id: str):
    """Delete one note, used by isolated seed and E2E cleanup."""
    try:
        deleted = delete_note(note_id)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover nota: {error}",
        )
    if deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota não encontrada")
    return {"deleted": deleted}


@app.post("/notes", response_model=List[Note], status_code=status.HTTP_201_CREATED, tags=["Notes"])
async def add_note(note: NoteCreate):
    """Create a note and generate its embedding with local Ollama."""
    try:
        return [create_note(note.title.strip(), note.content.strip())]
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar nota: {error}",
        )


@app.delete("/notes", tags=["Notes"])
async def delete_notes():
    """Delete all notes from the local database."""
    try:
        deleted = delete_all_notes()
        return {"message": "Todas as notas foram removidas", "deleted": deleted}
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover notas: {error}",
        )


# ============================================================
# Chat Endpoints
# ============================================================

@app.post(
    "/chat",
    response_model=ChatResponse,
    tags=["Chat"],
    summary="Enviar mensagem para o chat AI"
)
async def send_message(chat_request: ChatRequest):
    """Send a message to the AI chat and get a response."""
    try:
        return ChatService.process_message(
            message=chat_request.message,
            session_id=chat_request.session_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar mensagem: {str(e)}"
        )


@app.get(
    "/chat/messages",
    response_model=List[dict],
    tags=["Chat"],
    summary="Listar mensagens do chat"
)
async def get_messages(
    session_id: str = Query("default", description="Session ID"),
    limit: int = Query(50, description="Número máximo de mensagens", ge=1, le=100)
):
    """Get chat messages for a session."""
    try:
        messages = ChatService.get_messages_from_db(session_id, limit)
        return messages
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar mensagens: {str(e)}"
        )


@app.delete(
    "/chat/messages",
    status_code=status.HTTP_200_OK,
    tags=["Chat"],
    summary="Limpar mensagens do chat"
)
async def clear_chat(session_id: str = Query("default", description="Session ID")):
    """Clear chat messages for a session."""
    try:
        ChatService.delete_session_messages(session_id)
        ChatService.clear_history(session_id)
        return {"message": "Chat limpo com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao limpar chat: {str(e)}"
        )
