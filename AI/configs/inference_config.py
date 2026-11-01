"""
Configuration parameters for the VoiceShield AI audio pipeline,
10-20 second audio segmentation, and Hugging Face LLM risk explanation.
"""
import os
from dataclasses import dataclass

TARGET_SAMPLE_RATE: int = 16000
MIN_SEGMENT_DURATION_SEC: float = 0.40
DEFAULT_WINDOW_SEC: float = 1.00
DEFAULT_HOP_SEC: float = 0.50
ENERGY_THRESHOLD_RMS: float = 0.008

# 10 to 30 seconds audio geometry and 5-second timeline intervals
MIN_LONG_AUDIO_SEC: float = 10.0
MAX_LONG_AUDIO_SEC: float = 30.0
INTERVAL_5S_SEC: float = 5.0

SYNTHETIC_THRESHOLD: float = 52.0
HUMAN_THRESHOLD: float = 48.0

MODEL_IDENTIFIER: str = "voiceshield-acoustic-dsp-v2"
HF_DEFAULT_LLM_MODEL: str = os.getenv("HF_LLM_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
HF_API_TOKEN: str = os.getenv("HF_TOKEN", os.getenv("HUGGINGFACE_API_KEY", ""))

DISCLAIMER_TEXT: str = (
    "Classification labels and confidence scores represent probabilistic acoustic forensic estimations. "
    "They do not constitute a definitive or legally binding guarantee of authenticity."
)

@dataclass
class AudioPipelineConfig:
    target_sr: int = TARGET_SAMPLE_RATE
    min_duration: float = MIN_SEGMENT_DURATION_SEC
    window_sec: float = DEFAULT_WINDOW_SEC
    hop_sec: float = DEFAULT_HOP_SEC
    energy_threshold: float = ENERGY_THRESHOLD_RMS
    synthetic_threshold: float = SYNTHETIC_THRESHOLD
    human_threshold: float = HUMAN_THRESHOLD
    min_long_audio: float = MIN_LONG_AUDIO_SEC
    max_long_audio: float = MAX_LONG_AUDIO_SEC
