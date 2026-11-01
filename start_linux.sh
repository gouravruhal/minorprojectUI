#!/usr/bin/env bash
set -e

echo "======================================================================="
echo "    VoiceShield AI - Real-Time Voice Cloning Detection Command Center"
echo "======================================================================="
echo ""

# 1. Verify Prerequisites
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is not installed or not in PATH."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH."
    exit 1
fi

# 2. Pre-flight Check: Trained Neural Checkpoint
CHECKPOINT_PATH="AI/checkpoints/forensic_model_trained.pt"
echo "[*] Pre-flight: Verifying trained model checkpoint..."
if [ ! -f "$CHECKPOINT_PATH" ]; then
    echo "[!] Checkpoint '$CHECKPOINT_PATH' not found on disk."
    echo "[*] Running physics-informed acoustic bootstrap trainer..."
    python3 scripts/train_bootstrap_model.py --epochs 12 --synthetic-samples 80
    if [ ! -f "$CHECKPOINT_PATH" ]; then
        echo "[ERROR] Model bootstrap failed. Cannot proceed without trained checkpoint."
        exit 1
    fi
    echo "[OK] Neural checkpoint trained and calibrated successfully."
else
    echo "[OK] Verified: Model checkpoint '$CHECKPOINT_PATH' is present."
fi

# 3. Dependency Verification
echo "[*] Verifying Python dependencies..."
python3 -m pip install -q -r requirements.txt

echo "[*] Verifying Frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "[*] Installing frontend npm packages..."
    (cd frontend && npm install)
fi

# 4. Concurrently Launch Backend & Frontend with Clean Process Trapping
echo ""
echo "======================================================================="
echo "[*] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "[*] Starting Vite React Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev -- --host 127.0.0.1 --port 5173) &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "[*] Shutting down VoiceShield AI services (PIDs: $BACKEND_PID, $FRONTEND_PID)..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "[OK] Services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "======================================================================="
echo "[SUCCESS] VoiceShield AI services running concurrently!"
echo "  - Backend REST & WebSocket: http://127.0.0.1:8000 (Docs: /docs)"
echo "  - Frontend SOC Command HUD: http://localhost:5173"
echo "======================================================================="
echo "Press Ctrl+C to terminate both servers."

if command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open http://localhost:5173 2>/dev/null || true
fi

wait

