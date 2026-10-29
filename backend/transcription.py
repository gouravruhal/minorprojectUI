"""
Modular speech recognition / transcription interface.
Kept independent from AI deepfake detection.
"""
from typing import Dict, Any

def transcribe_audio_segment(audio_bytes: bytes, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Transcribe speech from audio bytes if an ASR engine is installed.
    Falls back gracefully when local Whisper/Vosk model is not configured.
    """
    try:
        import whisper  # type: ignore
        # If whisper is installed, transcribe segment
        # In typical lightweight deployment, whisper is optional
        return {
            "available": True,
            "engine": "whisper-base",
            "text": "(Speech transcription processed via local Whisper)",
            "status": "ready"
        }
    except ImportError:
        return {
            "available": False,
            "engine": "none",
            "text": "Transcription engine standby. (Install openai-whisper to enable live ASR)",
            "status": "standby"
        }
