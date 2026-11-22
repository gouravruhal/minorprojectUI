"""
VoiceShield AI Developer SDK and Integration Endpoints.
Provides API schemas, ready-to-run client snippets for Python, JS/Node, and cURL.
"""
from fastapi import APIRouter
from typing import Dict, Any, List

router = APIRouter(prefix="/api/v1/sdk", tags=["Developer SDK & Integration"])

PYTHON_REST_SNIPPET = '''import requests

API_BASE = "http://localhost:8000"

def analyze_call_audio(file_path: str, claimed_vip: str = "VIP-001") -> dict:
    with open(file_path, "rb") as f:
        files = {"file": (file_path, f, "audio/wav")}
        data = {
            "caller_id": "+91-98765-43210",
            "route_type": "cellular",
            "transaction_amount": 75000,
            "known_contact": True,
            "claimed_identity": claimed_vip
        }
        res = requests.post(f"{API_BASE}/api/v1/analyze-audio", files=files, data=data)
        res.raise_for_status()
        return res.json()

result = analyze_call_audio("call_audio.wav")
print(f"Risk: {result['final_risk_score']}% | Tier: {result['final_threat_tier']}")
print(f"Action: {result['action_recommendation']}")
'''

PYTHON_WS_SNIPPET = '''import asyncio
import json
import websockets

async def stream_call_telemetry(call_id: str = "live_call_001"):
    uri = f"ws://localhost:8000/ws/live-call/{call_id}"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "action": "configure",
            "context": {"claimed_vip": "VIP-001", "transaction_amount": 95000}
        }))
        print("Connected to VoiceShield AI Live Call WebSocket stream.")
        async for msg in ws:
            event = json.loads(msg)
            if event.get("type") == "SECURITY_ALERT":
                print(f"[SECURITY ALERT] {event['alert']['action']}: {event['alert']['reason']}")
            elif event.get("type") == "TELEMETRY":
                print(f"T+{event['timestamp_sec']}s: Risk={event['risk_score']}% | Tier={event['threat_tier']}")

asyncio.run(stream_call_telemetry())
'''

JS_REST_SNIPPET = '''// VoiceShield AI - JavaScript / TypeScript REST Ingestion
async function analyzeAudio(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('caller_id', '+91-98765-43210');
  formData.append('route_type', 'cellular');
  formData.append('transaction_amount', '75000');
  formData.append('known_contact', 'true');
  formData.append('claimed_identity', 'VIP-001');

  const res = await fetch('http://localhost:8000/api/v1/analyze-audio', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  console.log(`Risk: ${data.final_risk_score}% | Action: ${data.action_recommendation}`);
  return data;
}
'''

JS_WS_SNIPPET = '''// VoiceShield AI - Browser / Node.js WebSocket Live Stream
function connectLiveCallStream(callId = 'stream_01', onAlert) {
  const ws = new WebSocket(`ws://localhost:8000/ws/live-call/${callId}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: 'configure',
      context: { claimed_vip: 'VIP-001', transaction_amount: 85000 }
    }));
  };
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === 'SECURITY_ALERT') {
      onAlert?.(payload.alert);
    }
  };
  return ws;
}
'''

CURL_SNIPPET = '''curl -X POST "http://localhost:8000/api/v1/analyze-audio" \\
  -F "file=@call_sample.wav" \\
  -F "caller_id=+91-98765-43210" \\
  -F "route_type=cellular" \\
  -F "transaction_amount=75000" \\
  -F "known_contact=true" \\
  -F "claimed_identity=VIP-001"
'''

@router.get("/snippets")
def get_sdk_snippets() -> Dict[str, Any]:
    return {
        "status": "success",
        "snippets": {
            "python_rest": PYTHON_REST_SNIPPET.strip(),
            "python_websocket": PYTHON_WS_SNIPPET.strip(),
            "javascript_rest": JS_REST_SNIPPET.strip(),
            "javascript_websocket": JS_WS_SNIPPET.strip(),
            "curl": CURL_SNIPPET.strip()
        }
    }

@router.get("/endpoints")
def get_key_endpoints() -> List[Dict[str, Any]]:
    return [
        {
            "method": "POST", "path": "/api/v1/analyze-audio", "protocol": "HTTP REST",
            "summary": "Zero-Disk RAM Ingestion with Multi-Layer DSP & 4-Factor Risk Engine",
            "latency": "< 45 ms", "status": "Production"
        },
        {
            "method": "GET / WS", "path": "/ws/live-call/{call_id}", "protocol": "WebSocket",
            "summary": "Low-Latency Bi-Directional Streaming (2.0s Sliding Window & Security Escalation)",
            "latency": "< 25 ms", "status": "Production"
        },
        {
            "method": "POST", "path": "/api/v1/security/challenge-mfa", "protocol": "HTTP REST",
            "summary": "Automated Instant Incident Mitigation & Step-up MFA Challenge",
            "latency": "< 10 ms", "status": "Production"
        },
        {
            "method": "GET", "path": "/api/voice-analysis/telecom/diagnostics", "protocol": "HTTP REST",
            "summary": "Hardware Line Tap Loop Diagnostics & CCITT Q.552 Telephony Status",
            "latency": "< 5 ms", "status": "Production"
        },
        {
            "method": "GET", "path": "/docs", "protocol": "OpenAPI / Swagger",
            "summary": "Interactive Auto-Generated Swagger UI Documentation",
            "latency": "Instant", "status": "Public"
        }
    ]
