"""
Business logic layer for notes operations.
"""
import uuid
from typing import List, Optional
from database import db
from models import NoteCreate, NoteUpdate, NoteResponse
from embeddings import generate_embedding


def vector_to_sql(embedding: List[float]) -> str:
    """Convert a Python list to a PostgreSQL vector string format."""
    return f"[{','.join(map(str, embedding))}]"


class NoteService:
    """Service class for note CRUD operations."""

    @staticmethod
    def create_note(note_data: NoteCreate) -> NoteResponse:
        """Create a new note with embedding."""
        embedding = generate_embedding(note_data.content)
        embedding_vector = vector_to_sql(embedding)
        
        query = """
            INSERT INTO notes (title, content, embedding)
            VALUES (%s, %s, %s::vector)
            RETURNING id, title, content, created_at
        """
        
        result = db.execute_with_return(
            query, 
            (note_data.title, note_data.content, embedding_vector)
        )
        
        return NoteResponse(**result)

    @staticmethod
    def list_notes(page: int = 1, page_size: int = 10) -> dict:
        """List notes with pagination (without embeddings)."""
        offset = (page - 1) * page_size
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM notes"
        count_result = db.execute_one(count_query)
        total = count_result['total'] if count_result else 0
        
        # Get paginated notes
        query = """
            SELECT id, title, content, created_at
            FROM notes
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        
        results = db.execute_query(query, (page_size, offset))
        notes = [NoteResponse(**row) for row in results]
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        
        return {
            "notes": notes,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }

    @staticmethod
    def search_notes(query_text: str, limit: int = 5) -> List[NoteResponse]:
        """Search notes by semantic similarity."""
        query_embedding = generate_embedding(query_text)
        query_vector = vector_to_sql(query_embedding)
        
        query = """
            SELECT id, title, content, created_at
            FROM notes
            ORDER BY embedding <-> %s::vector
            LIMIT %s
        """
        
        results = db.execute_query(query, (query_vector, limit))
        return [NoteResponse(**row) for row in results]

    @staticmethod
    def get_note_by_id(note_id: uuid.UUID) -> Optional[NoteResponse]:
        """Get a note by its ID."""
        query = """
            SELECT id, title, content, created_at
            FROM notes
            WHERE id = %s
        """
        
        result = db.execute_one(query, (str(note_id),))
        
        if result:
            return NoteResponse(**result)
        return None

    @staticmethod
    def update_note(note_id: uuid.UUID, note_data: NoteUpdate) -> Optional[NoteResponse]:
        """Update an existing note."""
        existing_note = NoteService.get_note_by_id(note_id)
        if not existing_note:
            return None
        
        title = note_data.title if note_data.title is not None else existing_note.title
        content = note_data.content if note_data.content is not None else existing_note.content
        
        # Check if content changed - regenerate embedding
        if note_data.content is not None and note_data.content != existing_note.content:
            embedding = generate_embedding(content)
            embedding_vector = vector_to_sql(embedding)
            
            query = """
                UPDATE notes
                SET title = %s, content = %s, embedding = %s::vector
                WHERE id = %s
                RETURNING id, title, content, created_at
            """
            result = db.execute_with_return(
                query,
                (title, content, embedding_vector, str(note_id))
            )
        else:
            query = """
                UPDATE notes
                SET title = %s, content = %s
                WHERE id = %s
                RETURNING id, title, content, created_at
            """
            result = db.execute_with_return(
                query,
                (title, content, str(note_id))
            )
        
        return NoteResponse(**result)

    @staticmethod
    def delete_note(note_id: uuid.UUID) -> bool:
        """Delete a note by its ID."""
        query = """
            DELETE FROM notes
            WHERE id = %s
            RETURNING id
        """
        
        result = db.execute_one(query, (str(note_id),))
        return result is not None

    @staticmethod
    def delete_all_notes() -> int:
        """Delete all notes and return the count of deleted notes."""
        # Get count before deleting
        count_query = "SELECT COUNT(*) as count FROM notes"
        count_result = db.execute_one(count_query)
        deleted_count = count_result['count'] if count_result else 0
        
        # Delete all
        query = "DELETE FROM notes"
        db.execute_delete(query)
        
        return deleted_count
