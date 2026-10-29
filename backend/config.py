"""
Configuration and environment settings for VoiceShield AI Voice Analysis Backend.
"""
import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Server Settings
BACKEND_HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

# Twilio Programmable Voice Credentials (kept strictly on the backend)
TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")

# Public WebSocket URL for external Twilio Media Streams webhook (e.g. ngrok or reverse proxy)
TWILIO_STREAM_WS_URL: Optional[str] = os.getenv("TWILIO_STREAM_WS_URL")

# CORS Origins
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://minorprojectui.vercel.app"
]

def is_twilio_configured() -> bool:
    """Check if valid Twilio provider credentials exist."""
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER)

def get_india_telecom_notice() -> dict:
    """
    Official telecommunications compliance notice regarding cellular call bridging in India.
    DoT (Department of Telecommunications) & TRAI regulatory overview.
    """
    return {
        "region": "India (+91)",
        "regulatory_body": "Telecom Regulatory Authority of India (TRAI) & Department of Telecommunications (DoT)",
        "direct_cellular_tap_status": "RESTRICTED",
        "explanation": (
            "Under Indian telecommunications law (Unified License Agreement & TRAI CLI regulations), "
            "third-party interception or automated recording of live cellular phone calls without explicit "
            "in-band mutual consent and lawful telecom authorization is prohibited. Furthermore, ordinary "
            "browser sandboxes and mobile operating systems cannot access cellular radio duplex audio directly."
        ),
        "supported_telecom_flows": [
            "Provider-initiated conference bridging via authorized SIP trunks / virtual DID numbers",
            "Acoustic speakerphone capture via authenticated local device microphone with on-screen consent",
            "Direct hardware TRRS / USB audio capture interface connected to handset headphone output"
        ],
        "twiml_prerequisite": (
            "To use Twilio Media Streams in India, a verified KYC regulatory bundle and approved "
            "outbound calling profile are required by Twilio India regulations."
        )
    }
