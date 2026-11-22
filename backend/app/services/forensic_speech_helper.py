"""
Forensic Speech & Intent Integration Helper.
Coordinates audio-language LLM transcription, suspicious phrase scanning,
and cross-modal speaker attribution for full calls and live streams.
"""
from typing import Dict, Any, Optional
import numpy as np
from AI.inference.audio_language_llm import audio_language_llm

def evaluate_speech_intent(
    audio_data: Any,
    sr: int = 16000,
    claimed_vip: Optional[str] = None,
    vip_verification: Optional[Dict[str, Any]] = None,
    acoustic_prob: float = 0.0
) -> Dict[str, Any]:
    """Runs zero-disk audio-language LLM transcription and conversational intent audit."""
    return audio_language_llm.analyze(
        audio_input=audio_data,
        sr_rate=sr,
        claimed_vip=claimed_vip,
        vip_verification=vip_verification,
        acoustic_prob=acoustic_prob
    )
