"""
Pydantic validation schemas for Context Analysis and LLM Reasoning.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ContextGenerateRequest(BaseModel):
    analysis_id: Optional[str] = None
    filename: str = Field(default="audio_sample.wav")
    caller_name: Optional[str] = Field(default="Caller")
    network: Optional[str] = Field(default="Standard PSTN")
    duration_seconds: Optional[float] = 4.0
    acoustic_risk: Optional[float] = 25.0
    voice_swap_detected: Optional[bool] = False
    context_metadata: Optional[Dict[str, Any]] = None

class ContextAnalysisResponse(BaseModel):
    context_id: str
    analysis_id: Optional[str] = None
    filename: str
    caller_name: str
    network: str
    duration_seconds: float
    transcript: str
    intent_category: str
    keywords: List[str]
    linguistic_score: float
    urgency_index: float
    acoustic_risk: float
    unified_risk_score: float
    unified_threat_tier: str
    recommended_action: str
    llm_reasoning_summary: str
    llm_model: str
    created_at: str
    metadata: Optional[Dict[str, Any]] = None

