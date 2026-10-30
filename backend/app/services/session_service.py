"""
Session management service for active analysis sessions and WebSockets.
"""
import uuid
from typing import Dict, Optional, Set
from fastapi import WebSocket
from backend.app.database import repository

class SessionService:
    def __init__(self):
        self.active_websockets: Dict[str, Set[WebSocket]] = {}

    def start_session(
        self,
        mode: str = "microphone",
        audio_source: str = "laptop_microphone",
        user_consent: bool = True,
        phone_number: Optional[str] = None
    ) -> Dict:
        session_id = f"SES-{uuid.uuid4().hex[:10].upper()}"
        return repository.create_session(
            session_id=session_id,
            mode=mode,
            audio_source=audio_source,
            user_consent=user_consent,
            phone_number=phone_number
        )

    def get_session(self, session_id: str) -> Optional[Dict]:
        return repository.get_session(session_id)

    def stop_session(self, session_id: str) -> bool:
        return repository.update_session_status(session_id, "stopped")

    def register_socket(self, session_id: str, ws: WebSocket):
        if session_id not in self.active_websockets:
            self.active_websockets[session_id] = set()
        self.active_websockets[session_id].add(ws)
        repository.update_session_status(session_id, "streaming")

    def unregister_socket(self, session_id: str, ws: WebSocket):
        if session_id in self.active_websockets:
            self.active_websockets[session_id].discard(ws)
            if not self.active_websockets[session_id]:
                del self.active_websockets[session_id]
                repository.update_session_status(session_id, "idle")

session_service = SessionService()

