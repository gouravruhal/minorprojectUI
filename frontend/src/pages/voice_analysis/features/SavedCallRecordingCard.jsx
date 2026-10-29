import React from 'react';
import { Download, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { downloadRecording } from '../../../core/audio/callAudioRecorder';
import './SavedCallRecording.css';

export function SavedCallRecordingCard({
  recording,
  onAnalyzeRecording,
  onResetCall
}) {
  if (!recording) return null;

  const handleDownload = () => {
    const filename = `call_${recording.phoneNumber.replace(/[\s+]/g, '_')}_${Date.now()}.webm`;
    downloadRecording(recording.blob, filename);
  };

  return (
    <div className="saved-recording-card animate-fade-in" id="saved-call-recording-dock">
      <div className="saved-recording-header">
        <div className="saved-recording-info">
          <div className="saved-status-tag">
            <CheckCircle2 size={13} className="text-safe" />
            <span>CALL RECORDING SAVED</span>
          </div>
          <h4 className="saved-phone-number mono-metric">{recording.phoneNumber}</h4>
          <span className="saved-meta-text">
            Duration: {recording.durationText} • Size: {recording.size} • Format: {recording.mimeType || 'audio/webm'}
          </span>
        </div>

        <div className="saved-recording-actions">
          <button
            id="download-call-audio-btn"
            className="btn-primary"
            onClick={handleDownload}
            type="button"
          >
            <Download size={14} />
            <span>Download Audio</span>
          </button>

          <button
            id="analyze-saved-call-btn"
            className="btn-start-ai-inspection"
            onClick={() => onAnalyzeRecording(recording)}
            type="button"
          >
            <Play size={14} />
            <span>Analyze Recording</span>
          </button>

          <button
            id="new-call-btn"
            className="btn-secondary"
            onClick={onResetCall}
            type="button"
            title="Start a new call"
          >
            <RotateCcw size={13} />
            <span>New Call</span>
          </button>
        </div>
      </div>

      <div className="saved-player-strip">
        <audio
          controls
          src={recording.audioUrl}
          className="saved-audio-player"
          preload="metadata"
        />
      </div>
    </div>
  );
}
