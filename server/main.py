"""
FastAPI application for Notes CRUD with Semantic Search.
"""
import uuid
from typing import List
from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from services import NoteService

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Notes CRUD API",
    description="API para gerenciamento de notas com busca semântica usando Supabase + pgvector",
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


@app.post(
    "/notes", 
    response_model=NoteResponse, 
    status_code=status.HTTP_201_CREATED,
    tags=["Notes"],
    summary="Criar nova nota"
)
async def create_note(note: NoteCreate):
    """Create a new note with semantic embedding."""
    try:
        return NoteService.create_note(note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar nota: {str(e)}"
        )


@app.get(
    "/notes", 
    response_model=NoteListResponse,
    tags=["Notes"],
    summary="Listar notas com paginação"
)
async def list_notes(
    page: int = Query(1, description="Número da página", ge=1),
    page_size: int = Query(10, description="Quantidade de notas por página", ge=1, le=100)
):
    """List notes with pagination."""
    try:
        return NoteService.list_notes(page=page, page_size=page_size)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar notas: {str(e)}"
        )


@app.get(
    "/notes/search", 
    response_model=List[NoteResponse],
    tags=["Notes"],
    summary="Buscar notas por similaridade semântica"
)
async def search_notes(
    q: str = Query(..., description="Texto para busca semântica", min_length=1),
    limit: int = Query(5, description="Número máximo de resultados", ge=1, le=20)
):
    """Search notes by semantic similarity."""
    try:
        return NoteService.search_notes(q, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na busca: {str(e)}"
        )


@app.get(
    "/notes/{note_id}", 
    response_model=NoteResponse,
    tags=["Notes"],
    summary="Obter nota por ID"
)
async def get_note(note_id: uuid.UUID):
    """Get a specific note by ID."""
    try:
        note = NoteService.get_note_by_id(note_id)
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada"
            )
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar nota: {str(e)}"
        )


@app.put(
    "/notes/{note_id}", 
    response_model=NoteResponse,
    tags=["Notes"],
    summary="Atualizar nota"
)
async def update_note(note_id: uuid.UUID, note: NoteUpdate):
    """Update an existing note."""
    try:
        updated_note = NoteService.update_note(note_id, note)
        if not updated_note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada"
            )
        return updated_note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar nota: {str(e)}"
        )


@app.delete(
    "/notes/{note_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Notes"],
    summary="Deletar nota"
)
async def delete_note(note_id: uuid.UUID):
    """Delete a note by ID."""
    try:
        deleted = NoteService.delete_note(note_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar nota: {str(e)}"
        )


@app.delete(
    "/notes",
    status_code=status.HTTP_200_OK,
    tags=["Notes"],
    summary="Deletar todas as notas"
)
async def delete_all_notes():
    """Delete all notes."""
    try:
        deleted_count = NoteService.delete_all_notes()
        return {"message": f"{deleted_count} nota(s) deletada(s) com sucesso", "deleted_count": deleted_count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar notas: {str(e)}"
        )


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
