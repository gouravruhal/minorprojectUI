import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

const SNIPPETS = {
  python_rest: {
    title: 'Python REST Client',
    lang: 'python',
    desc: 'Synchronous zero-disk audio upload with 4-factor context metadata.',
    code: `import requests

API_BASE = "http://localhost:8000"

def analyze_call_audio(wav_path: str, claimed_vip: str = "VIP-001") -> dict:
    with open(wav_path, "rb") as audio_file:
        files = {"file": (wav_path, audio_file, "audio/wav")}
        payload = {
            "caller_id": "+91-98765-43210",
            "route_type": "cellular",
            "transaction_amount": 75000,
            "known_contact": True,
            "claimed_identity": claimed_vip
        }
        res = requests.post(f"{API_BASE}/api/v1/analyze-audio", files=files, data=payload)
        res.raise_for_status()
        return res.json()

report = analyze_call_audio("call_sample.wav")
print(f"Risk: {report['final_risk_score']}% | Tier: {report['final_threat_tier']}")
print(f"Action: {report['action_recommendation']}")`
  },
  python_ws: {
    title: 'Python WebSocket Client',
    lang: 'python',
    desc: 'Live streaming client sending 2.0s rolling audio frames with security alerts.',
    code: `import asyncio
import json
import websockets

async def stream_live_call(call_id: str = "live_call_001"):
    uri = f"ws://localhost:8000/ws/live-call/{call_id}"
    async with websockets.connect(uri) as ws:
        # Step 1: Send context metadata
        await ws.send(json.dumps({
            "action": "configure",
            "context": {"claimed_vip": "VIP-001", "transaction_amount": 95000}
        }))
        print("[VoiceShield] Connected to live call stream.")

        # Step 2: Stream audio & receive telemetry
        async for raw in ws:
            event = json.loads(raw)
            if event.get("type") == "SECURITY_ALERT":
                print(f"[SECURITY ALERT] {event['alert']['action']}: {event['alert']['reason']}")
            elif event.get("type") == "TELEMETRY":
                print(f"T+{event['timestamp_sec']}s: Risk={event['risk_score']}%")

asyncio.run(stream_live_call())`
  },
  js_rest: {
    title: 'JavaScript / Node.js REST',
    lang: 'javascript',
    desc: 'Browser or Node.js multipart upload returning instant forensic telemetry.',
    code: `// Zero-Disk In-Memory RAM REST Ingestion
async function analyzeAudioStream(audioBlob) {
  const form = new FormData();
  form.append('file', audioBlob, 'stream_recording.wav');
  form.append('caller_id', '+91-98765-43210');
  form.append('route_type', 'cellular');
  form.append('transaction_amount', '75000');
  form.append('claimed_identity', 'VIP-001');

  const response = await fetch('http://localhost:8000/api/v1/analyze-audio', {
    method: 'POST',
    body: form
  });

  const report = await response.json();
  console.log('Risk Score:', report.final_risk_score);
  console.log('Action Recommendation:', report.action_recommendation);
  return report;
}`
  },
  js_ws: {
    title: 'JavaScript WebSocket Stream',
    lang: 'javascript',
    desc: 'Real-time bi-directional streaming client with instant security alert listener.',
    code: `// Real-Time Bi-Directional WebSocket Streaming
function connectVoiceShieldStream(callId, onTelemetry, onSecurityAlert) {
  const ws = new WebSocket(\`ws://localhost:8000/ws/live-call/\${callId}\`);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: 'configure',
      context: { claimed_vip: 'VIP-001', transaction_amount: 85000 }
    }));
  };

  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === 'SECURITY_ALERT') {
      onSecurityAlert(payload.alert);
    } else if (payload.type === 'TELEMETRY') {
      onTelemetry(payload);
    }
  };

  return ws;
}`
  },
  curl_rest: {
    title: 'cURL CLI Terminal',
    lang: 'bash',
    desc: 'Direct command-line verification using cURL.',
    code: `curl -X POST "http://localhost:8000/api/v1/analyze-audio" \\
  -F "file=@call_sample.wav" \\
  -F "caller_id=+91-98765-43210" \\
  -F "route_type=cellular" \\
  -F "transaction_amount=75000" \\
  -F "known_contact=true" \\
  -F "claimed_identity=VIP-001"`
  }
};

export function SdkCodeSnippets() {
  const [activeSnippetKey, setActiveSnippetKey] = useState('python_rest');
  const [copiedKey, setCopiedKey] = useState(null);

  const activeSnippet = SNIPPETS[activeSnippetKey];

  const handleCopy = (key, code) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="sdk-code-snippets-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Code2 size={18} className="text-accent" />
          <h3 className="panel-heading">Production SDK & Integration Snippets</h3>
        </div>
        <div className="snippet-nav-tabs">
          {Object.entries(SNIPPETS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              className={`snippet-tab-btn ${activeSnippetKey === key ? 'active' : ''}`}
              onClick={() => setActiveSnippetKey(key)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <div className="snippet-desc-row">
        <p className="text-xs text-dim">{activeSnippet.desc}</p>
        <button
          type="button"
          className="btn-clay-secondary text-xs flex-center gap-1"
          onClick={() => handleCopy(activeSnippetKey, activeSnippet.code)}
        >
          {copiedKey === activeSnippetKey ? <Check size={13} className="text-safe" /> : <Copy size={13} />}
          <span>{copiedKey === activeSnippetKey ? 'Copied to Clipboard!' : 'Copy Code'}</span>
        </button>
      </div>

      <div className="snippet-code-container clay-inset">
        <pre className="snippet-pre mono-metric">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>
    </div>
  );
}

export default SdkCodeSnippets;
