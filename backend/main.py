"""
VoiceShield AI Backend Entrypoint Wrapper.
Provides compatibility for `uvicorn backend.main:app` and `python backend/main.py`.
"""
from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import BACKEND_HOST, BACKEND_PORT
    uvicorn.run("backend.app.main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)
