import React, { useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import { audioEngine } from '../../../core/audio/audio_engine';
import { useTheme } from '../../../core/theme/ThemeContext';
import './SpectralHeatmap.css';

export function SpectralHeatmap({ isStreaming, riskScore, vocoderDetected }) {
  const { themeTokens } = useTheme();
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const spectrumPrimary = themeTokens?.spectrumPrimary || '#EA580C';
  const spectrumAlert = themeTokens?.spectrumAlert || '#EF4444';
  const spectrumSecondary = themeTokens?.spectrumSecondary || '#FED7AA';

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

      if (!isStreaming) {
        const numBars = 48;
        const barWidth = width / numBars - 2;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + 2);
          ctx.fillRect(x, height - 6, barWidth, 6);
        }
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const freqData = audioEngine.getFrequencyData();
      const numBars = 48;
      const step = Math.floor(freqData.length / numBars);
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const value = freqData[i * step] || 0;
        const barHeight = Math.max(4, (value / 255) * (height - 10));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const isHighFreq = i > 26;

        let fillStyle = spectrumPrimary;
        if (isHighFreq && vocoderDetected) {
          fillStyle = spectrumAlert;
        } else if (riskScore >= 70) {
          fillStyle = spectrumAlert;
        } else if (riskScore >= 35) {
          fillStyle = spectrumSecondary;
        } else if (isHighFreq) {
          fillStyle = spectrumSecondary;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isStreaming, riskScore, vocoderDetected, spectrumPrimary, spectrumAlert, spectrumSecondary]);

  return (
    <div className="spectral-heatmap" id="spectral-heatmap-card">
      <div className="heatmap-header">
        <div className="title-row">
          <BarChart3 size={15} className="text-orange" />
          <h4 className="heatmap-heading">Spectral Frequency FFT (0 - 8 kHz)</h4>
        </div>
        {vocoderDetected && isStreaming && (
          <span className="vocoder-alert-badge">Vocoder Artifacts Detected</span>
        )}
      </div>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="spectrum-canvas" id="audio-spectrum-canvas" />
      </div>
      <div className="frequency-labels">
        <span>0 Hz</span>
        <span>2 kHz</span>
        <span>4 kHz</span>
        <span>8 kHz</span>
      </div>
    </div>
  );
}
