"""
Database connection and operations using psycopg3.
"""
import os
from contextlib import contextmanager
from typing import Optional, List
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")


class Database:
    """Database manager class for PostgreSQL operations."""

    def __init__(self, connection_string: str = None):
        self.connection_string = connection_string or DATABASE_URL
        if not self.connection_string:
            raise ValueError("DATABASE_URL environment variable is not set")

    @contextmanager
    def get_connection(self):
        """Context manager for getting a database connection."""
        conn = psycopg.connect(self.connection_string)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[dict]:
        """Execute a query and return results as list of dictionaries."""
        with self.get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                return cur.fetchall()

    def execute_one(self, query: str, params: Optional[tuple] = None) -> Optional[dict]:
        """Execute a query and return a single result as dictionary."""
        with self.get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                return cur.fetchone()

    def execute_delete(self, query: str, params: Optional[tuple] = None) -> int:
        """Execute a DELETE or UPDATE query and return the number of affected rows."""
        with self.get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                conn.commit()
                return cur.rowcount

    def execute_with_return(self, query: str, params: Optional[tuple] = None) -> Optional[dict]:
        """Execute a query with RETURNING clause and return the result."""
        with self.get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                conn.commit()
                return cur.fetchone()


# Singleton instance
db = Database()
