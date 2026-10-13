import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { audioEngine } from '../../../core/audio/audio_engine';
import { useTheme } from '../../../core/theme/ThemeContext';
import './RealtimeWaveform.css';

export function RealtimeWaveform({ isStreaming, riskScore }) {
  const { themeTokens } = useTheme();
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const waveformStroke = themeTokens?.waveformStroke || '#FED7AA';
  const waveformShadow = themeTokens?.waveformShadow || 'rgba(234, 88, 12, 0.5)';
  const waveformAlert = themeTokens?.waveformAlert || '#EA580C';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Draw center reference grid line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isStreaming) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const buffer = audioEngine.getWaveformData();
      const sliceWidth = width / buffer.length;

      ctx.lineWidth = 2.2;

      let strokeColor = waveformStroke;
      let shadowColor = waveformShadow;

      if (riskScore >= 70) {
        strokeColor = waveformAlert;
        shadowColor = waveformShadow;
      } else if (riskScore >= 35) {
        strokeColor = waveformStroke;
      }

      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      let x = 0;

      for (let i = 0; i < buffer.length; i++) {
        const v = buffer[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isStreaming, riskScore, waveformStroke, waveformShadow, waveformAlert]);

  return (
    <div className="realtime-waveform" id="waveform-visualizer-card">
      <div className="visualizer-header">
        <div className="title-row">
          <Activity size={15} className="text-orange" />
          <h4 className="visualizer-heading">Acoustic Oscilloscope (Time-Domain)</h4>
        </div>
        <span className="fps-badge">60 FPS DSP</span>
      </div>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="waveform-canvas" id="audio-waveform-canvas" />
      </div>
    </div>
  );
}
