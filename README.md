# VoiceShield AI

> **Production-Structured Real-Time Detection and Prevention of AI Voice Cloning & Synthetic Impersonation Attacks**

---

## 🎯 Architecture Overview
The platform is organized into three production applications, one research directory, and utility scripts:

```text
project-root/
├── frontend/    # React + Vite Web UI (Microphone Analysis & File Upload HUD)
├── backend/     # FastAPI REST & WebSocket Server, SQLite Database & Session Manager
├── AI/          # Signal Preprocessing, Biomechanical Modeling, Training & Inference
├── research/    # Project Synopsis, Literature Review, Methodology, Datasets & References
├── scripts/     # Line count checker, test runners, and developer scripts
└── docs/        # Architectural and compliance specifications
```

---

## 🚀 Two Core Functional Modes (Voice Analysis)

1. **Microphone Analysis (Feature A):**
   - Direct local microphone capture via browser Web Audio API.
   - Ongoing binary audio streaming via WebSocket to `/api/voice/live/{session_id}`.
   - Low-latency acoustic inspection (Jitter PPQ5, Shimmer APQ3, HNR, Spectral Centroid, Vocoder trace).
   - Real-time updates with classification labels, confidence scores, and latency.

2. **Recorded Audio Analysis (Feature B):**
   - Multi-format validation for WAV, MP3, WebM, and FLAC audio files (< 25MB).
   - Upload via `POST /api/voice/upload` with automatic temporary file cleanup.
   - Multi-segment sliding-window inspection (1.0s window, 0.5s step).
   - Detailed forensic report with overall verdict, confidence, segment-by-segment timeline, and SQLite persistence.

---

## 🛠️ Quick Start & Developer Commands

### 1. Install Backend & AI Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend && npm install && cd ..
```

### 3. Run Backend API Server
```bash
npm run backend
# or: uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Run Frontend Development Server
```bash
npm run dev
# Vite runs on http://localhost:5173 with proxy to backend port 8000
```

### 5. Automated Tests & Line Count Check
```bash
npm run test
# Executes line count verification (<= 200 lines), AI unit tests, and API integration tests
```
