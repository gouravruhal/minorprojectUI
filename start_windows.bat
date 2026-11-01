@echo off
setlocal enabledelayedexpansion

echo =======================================================================
echo     VoiceShield AI - Real-Time Voice Cloning Detection Command Center
echo =======================================================================
echo.

:: 1. Verify Prerequisites
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm is not installed or not in PATH. Please install Node 18+.
    pause
    exit /b 1
)

:: 2. Pre-flight Check: Trained Neural Checkpoint
set CHECKPOINT_PATH=AI\checkpoints\forensic_model_trained.pt
echo [*] Pre-flight: Verifying trained model checkpoint...
if not exist "%CHECKPOINT_PATH%" (
    echo [!] Checkpoint '%CHECKPOINT_PATH%' not found on disk.
    echo [*] Running physics-informed acoustic bootstrap trainer...
    python scripts\train_bootstrap_model.py --epochs 12 --synthetic-samples 80
    if not exist "%CHECKPOINT_PATH%" (
        echo [ERROR] Model bootstrap failed. Cannot proceed without trained checkpoint.
        pause
        exit /b 1
    )
    echo [OK] Neural checkpoint trained and calibrated successfully.
) else (
    echo [OK] Verified: Model checkpoint '%CHECKPOINT_PATH%' is present.
)

:: 3. Dependency Verification
echo [*] Checking Python dependencies...
python -m pip install -q -r requirements.txt

echo [*] Checking Frontend dependencies...
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm packages...
    cd frontend && npm install && cd ..
)

:: 4. Concurrently Launch Backend & Frontend
echo.
echo =======================================================================
echo [*] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "VoiceShield Backend (FastAPI)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Starting Vite React Frontend on http://localhost:5173 ...
start "VoiceShield Frontend (Vite/React)" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================================
echo [SUCCESS] VoiceShield AI services launched successfully!
echo   - Backend REST & WS: http://127.0.0.1:8000 (Docs: /docs)
echo   - Frontend SOC HUD:  http://localhost:5173
echo =======================================================================
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173
echo.
echo Press any key to exit this launcher window (services keep running).
pause >nul

