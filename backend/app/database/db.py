"""
SQLite connection manager and schema initialization.
Uses standard library sqlite3 for zero-dependency local reliability.
"""
import sqlite3
import os
from contextlib import contextmanager
from backend.app.core.config import DATABASE_PATH

def init_db():
    """Initializes SQLite database tables if not already present."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                mode TEXT NOT NULL,
                audio_source TEXT NOT NULL,
                user_consent INTEGER NOT NULL,
                phone_number TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voice_analyses (
                analysis_id TEXT PRIMARY KEY,
                session_id TEXT,
                mode TEXT NOT NULL,
                filename TEXT,
                file_size_bytes INTEGER,
                sample_rate INTEGER,
                duration_seconds REAL,
                label TEXT NOT NULL,
                confidence REAL NOT NULL,
                synthetic_probability REAL NOT NULL,
                is_synthetic INTEGER NOT NULL,
                status TEXT NOT NULL,
                model_identifier TEXT NOT NULL,
                metrics_json TEXT NOT NULL,
                segments_json TEXT NOT NULL,
                processing_time_ms REAL,
                error_message TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            );
        """)
        conn.commit()

@contextmanager
def get_connection():
    """Provides a thread-safe SQLite connection context with row dictionary factory."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

