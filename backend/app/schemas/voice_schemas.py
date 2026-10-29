"""
Pydantic validation schemas for voice analysis API requests and responses.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CreateSessionRequest(BaseModel):
    mode: str = Field(default="microphone", description="Analysis mode: 'microphone' | 'upload' | 'telecom'")
    audio_source: str = Field(default="laptop_microphone")
    user_consent: bool = Field(default=True, description="Explicit user consent for recording/analysis")
    phone_number: Optional[str] = None

class SessionResponse(BaseModel):
    session_id: str
    mode: str
    audio_source: str
    user_consent: bool
    status: str
    created_at: str
    phone_number: Optional[str] = None

class SegmentResult(BaseModel):
    start_time_sec: float
    end_time_sec: float
    synthetic_probability: float
    label: str
    f0_hz: Optional[float] = None
    jitter_ppq: Optional[float] = None
    shimmer_apq: Optional[float] = None
    hnr_db: Optional[float] = None

class AcousticMetrics(BaseModel):
    duration_seconds: float
    rms_energy: float
    f0_mean_hz: float
    jitter_ppq: float
    shimmer_apq: float
    hnr_db: float
    spectral_centroid: float
    spectral_rolloff: float
    vocoder_signature: str
    vocoder_detected: bool

class AnalysisResponse(BaseModel):
    analysis_id: str
    session_id: Optional[str] = None
    mode: str
    filename: Optional[str] = None
    label: str
    confidence: float
    synthetic_probability: float
    is_synthetic: bool
    status: str
    processing_time_ms: float
    model_identifier: str
    disclaimer: str
    segments_count: int
    segments: List[Dict[str, Any]] = []
    metrics: Dict[str, Any]
    created_at: str
    error_message: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    model: str
