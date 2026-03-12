"""
FastAPI application for Chat AI with Notes.
"""
from typing import List
from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import ChatRequest, ChatResponse
from chat_service import ChatService

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
