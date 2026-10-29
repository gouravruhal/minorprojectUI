"""
Telephony provider integration service (Twilio Programmable Voice & Media Streams).
Handles TwiML generation, webhook validation, and audio stream routing.
Includes regulatory verification for Indian telecommunications (TRAI/DoT).
"""
import base64
import json
import logging
from typing import Dict, Any, Optional
from backend.config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    TWILIO_STREAM_WS_URL,
    is_twilio_configured,
    get_india_telecom_notice
)
from backend.audio_dsp import decode_mulaw_bytes
from backend.voice_detector import classify_voice_segment

logger = logging.getLogger("telecom_service")

class TelecomProviderService:
    def __init__(self):
        self.active_streams: Dict[str, Dict[str, Any]] = {}

    def get_provider_status(self) -> Dict[str, Any]:
        """Check provider configuration and regional regulatory status."""
        configured = is_twilio_configured()
        return {
            "provider": "Twilio Programmable Voice (Media Streams)",
            "configured": configured,
            "account_sid_present": bool(TWILIO_ACCOUNT_SID),
            "phone_number_configured": bool(TWILIO_PHONE_NUMBER),
            "india_compliance": get_india_telecom_notice(),
            "instructions": (
                "To enable live provider calls, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                "and TWILIO_PHONE_NUMBER in backend/.env. For testing without Twilio credentials, "
                "use the direct Laptop Microphone or Audio Interface Cellular Bridge."
            ) if not configured else "Twilio provider configured and ready for outbound/inbound media streaming."
        }

    def initiate_telecom_stream(self, phone_number: str, consent_granted: bool) -> Dict[str, Any]:
        """
        Initiate a provider-controlled call leg.
        Enforces explicit caller/callee consent before stream initialization.
        """
        if not consent_granted:
            return {
                "success": False,
                "error": "CONSENT_REQUIRED",
                "message": "User consent must be explicitly recorded before initiating telephony audio streaming."
            }

        # Check for Indian number prefix (+91)
        is_india = phone_number.startswith("+91") or phone_number.startswith("91")

        if not is_twilio_configured():
            return {
                "success": False,
                "error": "PROVIDER_CREDENTIALS_MISSING",
                "message": (
                    "Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) are not configured on this server. "
                    "Cannot initiate cloud provider call."
                ),
                "troubleshooting": {
                    "step_1": "Create a Twilio account and obtain an approved Voice DID number.",
                    "step_2": "Add credentials to backend/.env.",
                    "step_3": (
                        "For Indian (+91) cellular calls, DoT regulations require a verified KYC regulatory bundle. "
                        "As an immediate alternative, use the Laptop Microphone (Speakerphone capture) mode."
                        if is_india else "Ensure destination number is verified or in your Twilio account."
                    )
                },
                "india_notice": get_india_telecom_notice() if is_india else None
            }

        try:
            # If Twilio library is installed, instantiate client
            from twilio.rest import Client  # type: ignore
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

            # Generate TwiML callback or media stream URL
            stream_url = TWILIO_STREAM_WS_URL or "wss://your-domain.com/ws/telecom/media-stream"

            # Create TwiML connecting the call directly to our WebSocket Media Stream
            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>This call is protected by VoiceShield AI real-time authenticity inspection. Audio is being analyzed for security.</Say>
    <Connect>
        <Stream url="{stream_url}">
            <Parameter name="customNumber" value="{phone_number}" />
        </Stream>
    </Connect>
</Response>"""

            call = client.calls.create(
                twiml=twiml,
                to=phone_number,
                from_=TWILIO_PHONE_NUMBER
            )

            return {
                "success": True,
                "call_sid": call.sid,
                "status": call.status,
                "provider": "Twilio Media Streams",
                "message": f"Telephony provider call initiated to {phone_number}."
            }
        except Exception as e:
            logger.error(f"Twilio call creation error: {str(e)}")
            return {
                "success": False,
                "error": "PROVIDER_API_ERROR",
                "message": f"Twilio API Error: {str(e)}"
            }

    def generate_twiml_response(self, stream_url: str) -> str:
        """Generate official TwiML to attach Media Streams to an inbound or outbound call."""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>VoiceShield AI call security active. Real-time media stream connected.</Say>
    <Connect>
        <Stream url="{stream_url}" />
    </Connect>
</Response>"""

    def process_media_packet(self, base64_payload: str) -> Optional[Dict[str, Any]]:
        """
        Process incoming base64 mu-law 8000Hz audio from Twilio Media Streams.
        Decodes payload, performs acoustic inspection, returns result.
        """
        try:
            raw_bytes = base64.b64decode(base64_payload)
            pcm_samples = decode_mulaw_bytes(raw_bytes)
            # Run modular AI voice detection on decoded samples
            return classify_voice_segment(pcm_samples, sr=8000)
        except Exception as e:
            logger.error(f"Error decoding media packet: {str(e)}")
            return None

telecom_service = TelecomProviderService()
