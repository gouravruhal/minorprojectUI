# VoiceShield AI - Backend API Service

FastAPI-powered REST and WebSocket server for real-time voice deepfake analysis, audio validation, SQLite persistence, and inference orchestration.

## Architecture
- `app/api/`: REST and WebSocket endpoint definitions (`voice_routes.py`, `health_routes.py`).
- `app/core/`: Configuration, file limits, and CORS policies (`config.py`).
- `app/database/`: SQLite connection management (`db.py`) and data repository (`repository.py`).
- `app/schemas/`: Pydantic request/response validation models (`voice_schemas.py`).
- `app/services/`: Voice analysis coordinator (`voice_service.py`) and session manager (`session_service.py`).
- `app/utils/`: Safe temporary audio storage and lifecycle cleanup (`temp_storage.py`).
- `tests/`: Automated unit and integration test suite (`test_api.py`).

## Quick Start
```bash
# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
