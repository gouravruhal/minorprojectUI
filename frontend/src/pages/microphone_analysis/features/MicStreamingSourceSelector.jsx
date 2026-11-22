import React from 'react';
import { Mic, PhoneCall, Volume2, VolumeX, Wifi, WifiOff, Upload } from 'lucide-react';

export function MicStreamingSourceSelector({
  streamMode,
  onChangeMode,
  sampleCalls = [],
  selectedSample,
  onSelectSample,
  onUploadCustomFile,
  wsStatus,
  wsLatency,
  isMuted,
  onToggleMute,
  isStreaming,
  playbackProgress
}) {
  return (
    <div className="mic-source-selector-card card clay-card">
      <div className="source-header-row">
        <div className="source-mode-toggles">
          <button
            type="button"
            className={`source-tab-btn ${streamMode === 'mic' ? 'tab-active' : ''}`}
            onClick={() => onChangeMode('mic')}
            disabled={isStreaming}
          >
            <Mic size={15} className="mr-1 inline" /> Live Microphone
          </button>
          <button
            type="button"
            className={`source-tab-btn ${streamMode === 'simulated' ? 'tab-active' : ''}`}
            onClick={() => onChangeMode('simulated')}
            disabled={isStreaming}
          >
            <PhoneCall size={15} className="mr-1 inline" /> Simulated Live Call Playback
          </button>
        </div>

        <div className="ws-status-badge-group">
          {wsStatus === 'CONNECTED' || wsStatus === 'STREAMING' ? (
            <span className="badge badge-safe flex-center gap-1">
              <Wifi size={12} className="text-safe animate-pulse" />
              <span>WebSocket Connected ({wsLatency > 0 ? `${wsLatency}ms` : '<25ms'})</span>
            </span>
          ) : wsStatus === 'CONNECTING' ? (
            <span className="badge badge-warning flex-center gap-1">
              <Wifi size={12} className="animate-spin" />
              <span>Connecting WS...</span>
            </span>
          ) : (
            <span className="badge badge-neutral flex-center gap-1">
              <WifiOff size={12} />
              <span>WS Ready</span>
            </span>
          )}
        </div>
      </div>

      {streamMode === 'simulated' && (
        <div className="simulated-playback-controls animate-fade-in">
          <div className="sample-select-row">
            <label className="text-xs font-bold text-main">Select Test Call Stream:</label>
            <select
              className="select-clay sample-dropdown"
              value={selectedSample}
              onChange={(e) => onSelectSample(e.target.value)}
              disabled={isStreaming}
            >
              {sampleCalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.duration_sec}s)
                </option>
              ))}
            </select>

            <label className="btn-clay-secondary btn-sm upload-custom-label">
              <Upload size={13} className="mr-1 inline" />
              <span>Upload Custom Call</span>
              <input
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) onUploadCustomFile(e.target.files[0]);
                }}
                disabled={isStreaming}
              />
            </label>

            <button
              type="button"
              className={`btn-clay-secondary btn-sm ${isMuted ? 'text-dim' : 'text-accent'}`}
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio Playback' : 'Mute Audio Playback'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="ml-1 text-xs">{isMuted ? 'Muted' : 'Audio On'}</span>
            </button>
          </div>

          {isStreaming && playbackProgress && (
            <div className="playback-progress-bar-row animate-fade-in">
              <span className="mono-metric text-xs text-dim">
                Streaming: {playbackProgress.currentSec}s / {playbackProgress.totalSec}s
              </span>
              <div className="bar-track flex-1">
                <div
                  className="bar-fill fill-blue"
                  style={{
                    width: `${Math.min(100, (playbackProgress.currentSec / (playbackProgress.totalSec || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MicStreamingSourceSelector;
