"""
Configuration parameters for the VoiceShield AI audio pipeline and inference engine.
"""
from dataclasses import dataclass

TARGET_SAMPLE_RATE: int = 16000
MIN_SEGMENT_DURATION_SEC: float = 0.40
DEFAULT_WINDOW_SEC: float = 1.00
DEFAULT_HOP_SEC: float = 0.50
ENERGY_THRESHOLD_RMS: float = 0.008

SYNTHETIC_THRESHOLD: float = 65.0
HUMAN_THRESHOLD: float = 35.0

MODEL_IDENTIFIER: str = "voiceshield-acoustic-dsp-v1"
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
