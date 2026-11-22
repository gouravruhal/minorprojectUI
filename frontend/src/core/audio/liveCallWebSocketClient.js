/**
 * VoiceShield AI - Low-Latency Live Call WebSocket Client
 * Connects to /ws/live-call/{callId} for bi-directional streaming of 2.0s audio slices.
 */

export class LiveCallWebSocketClient {
  constructor({ onFrame, onAlert, onStatusChange }) {
    this.ws = null;
    this.callId = null;
    this.onFrame = onFrame;
    this.onAlert = onAlert;
    this.onStatusChange = onStatusChange;
    this.status = 'DISCONNECTED';
    this.lastPingTime = 0;
    this.latencyMs = 0;
  }

  connect(callId, context = {}) {
    this.disconnect();
    this.callId = callId || `call_${Date.now()}`;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-call/${this.callId}`;

    this._updateStatus('CONNECTING');

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this._updateStatus('CONNECTED');
        this.sendConfig(context);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'SECURITY_ALERT') {
            this.onAlert?.(data);
          } else if (data.frame_index !== undefined) {
            if (this.lastPingTime > 0) {
              this.latencyMs = Math.round(performance.now() - this.lastPingTime);
            }
            this.onFrame?.({
              ...data,
              clientLatencyMs: this.latencyMs,
              chunkId: data.frame_index,
              timestampSec: data.timestamp_sec,
              timeLabel: new Date().toLocaleTimeString(),
              riskScore: Number(data.risk_score ?? 10.0),
              threatTier: data.threat_tier ?? 'SAFE',
              isSynthetic: Boolean(data.risk_score >= 50),
              action: data.action ?? 'CONTINUE_MONITORING',
              riskBreakdown: data.risk_breakdown || null,
              dspFeatures: data.dsp_features || null,
              speakerVerification: data.vip_verification ? { vip_verification: data.vip_verification } : null
            });
          }
        } catch (err) {
          console.warn('[LiveCallWS] Message parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[LiveCallWS] WebSocket error:', err);
        this._updateStatus('ERROR');
      };

      this.ws.onclose = () => {
        this._updateStatus('DISCONNECTED');
        this.ws = null;
      };
    } catch (err) {
      console.warn('[LiveCallWS] Failed to initiate connection:', err);
      this._updateStatus('ERROR');
    }
  }

  sendConfig(context = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'configure',
        context: {
          transaction_sensitivity: context.transactionSensitivity || 'medium',
          caller_trust_level: context.callerTrustLevel || 'standard',
          route_type: context.routeType || 'cellular',
          transaction_amount: Number(context.transactionAmount || 0),
          known_contact: context.knownContact !== false,
          claimed_identity: context.claimedIdentity || '',
          claimed_vip: context.claimedIdentity || '',
          caller_id: context.callerId || 'LIVE_STREAM_CLIENT'
        }
      }));
    }
  }

  sendAudioChunk(arrayBufferOrBlob) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.lastPingTime = performance.now();
    this.ws.send(arrayBufferOrBlob);
    this._updateStatus('STREAMING');
    return true;
  }

  disconnect() {
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ action: 'stop' }));
        }
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this._updateStatus('DISCONNECTED');
  }

  _updateStatus(newStatus) {
    this.status = newStatus;
    this.onStatusChange?.(newStatus, this.latencyMs);
  }
}

export default LiveCallWebSocketClient;
