"""
Session manager for live voice analysis.
Tracks session authorization, audio sources, consent state, and connected WebSockets.
"""
import time
import uuid
from typing import Dict, Any, Optional, Set
from fastapi import WebSocket

class VoiceAnalysisSession:
    def __init__(self, session_id: str, mode: str, audio_source: str, user_consent: bool, phone_number: Optional[str] = None):
        self.session_id = session_id
        self.mode = mode
        self.audio_source = audio_source
        self.user_consent = user_consent
        self.phone_number = phone_number
        self.state = "connected" if user_consent else "awaiting_consent"
        self.created_at = time.time()
        self.last_updated = time.time()
        self.last_result: Optional[Dict[str, Any]] = None
        self.active_websockets: Set[WebSocket] = set()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "mode": self.mode,
            "audio_source": self.audio_source,
            "user_consent": self.user_consent,
            "phone_number": self.phone_number,
            "state": self.state,
            "created_at": self.created_at,
            "duration_seconds": round(time.time() - self.created_at, 1),
            "last_result": self.last_result
        }

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, VoiceAnalysisSession] = {}

    def create_session(self, mode: str, audio_source: str, user_consent: bool, phone_number: Optional[str] = None) -> VoiceAnalysisSession:
        session_id = str(uuid.uuid4())
        session = VoiceAnalysisSession(
            session_id=session_id,
            mode=mode,
            audio_source=audio_source,
            user_consent=user_consent,
            phone_number=phone_number
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[VoiceAnalysisSession]:
        return self._sessions.get(session_id)

    def update_state(self, session_id: str, new_state: str) -> Optional[VoiceAnalysisSession]:
        session = self.get_session(session_id)
        if session:
            session.state = new_state
            session.last_updated = time.time()
        return session

    def register_websocket(self, session_id: str, ws: WebSocket):
        session = self.get_session(session_id)
        if session:
            session.active_websockets.add(ws)

    def unregister_websocket(self, session_id: str, ws: WebSocket):
        session = self.get_session(session_id)
        if session and ws in session.active_websockets:
            session.active_websockets.remove(ws)

    async def broadcast_event(self, session_id: str, event_data: Dict[str, Any]):
        session = self.get_session(session_id)
        if not session:
            return
        session.last_result = event_data
        disconnected = set()
        for ws in session.active_websockets:
            try:
                await ws.send_json(event_data)
            except Exception:
                disconnected.add(ws)
        for dead_ws in disconnected:
            session.active_websockets.discard(dead_ws)

session_manager = SessionManager()
