import React, { useEffect, useRef } from 'react';
import { Mic, Activity, Radio } from 'lucide-react';

export function MicLiveWaveform({ isStreaming, audioLevel = 0, currentChunk = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isStreaming ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)';

      const amp = isStreaming ? Math.max(4, (audioLevel / 100) * (h * 0.42)) : 2;
      for (let x = 0; x < w; x++) {
        const sinVal = Math.sin((x * 0.04) + phase) * Math.sin(x * 0.015);
        const y = midY + sinVal * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (isStreaming) {
        phase += 0.12;
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isStreaming, audioLevel]);

  return (
    <div className="mic-waveform-card card clay-card">
      <div className="mic-card-top-row">
        <div className="flex-center gap-2">
          <div className={`mic-pulse-dot ${isStreaming ? 'pulse-live' : 'pulse-idle'}`}>
            <Radio size={14} />
          </div>
          <span className="font-bold text-sm">
            {isStreaming ? `Live Audio Stream Ingress (Chunk #${currentChunk})` : 'Microphone Inactive'}
          </span>
        </div>
        <div className="flex-center gap-2">
          <span className="mono-metric text-xs text-dim">
            Level: {audioLevel}%
          </span>
          <span className={`badge ${isStreaming ? 'badge-safe' : 'badge-neutral'}`}>
            {isStreaming ? '2.0s Inference Cycle' : 'Standby'}
          </span>
        </div>
      </div>

      <div className="waveform-canvas-box clay-inset">
        <canvas ref={canvasRef} width={640} height={100} className="waveform-canvas" />
      </div>

      <div className="volume-meter-track">
        <div
          className="volume-meter-bar"
          style={{
            width: `${Math.min(100, audioLevel)}%`,
            background: audioLevel > 70 ? 'var(--danger-red)' : 'var(--accent-blue)'
          }}
        />
      </div>
    </div>
  );
}

export default MicLiveWaveform;

