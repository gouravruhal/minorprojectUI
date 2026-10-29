import React from 'react';
import { FileAudio, UploadCloud, CheckCircle2, AlertTriangle, Play, Square, Trash2 } from 'lucide-react';
import './CustomFileUploader.css';

export function CustomFileUploader({
  fileInputRef,
  onFileChange,
  uploadedFile,
  customFileResult,
  onLoadSampleFile,
  isStreaming,
  onStartStream,
  onStopStream,
  onClearFile
}) {
  return (
    <div className="upload-section-card card animate-fade-in" id="file-uploader-ingress-section">
      <div className="upload-section-header">
        <h3 className="upload-section-title">Call Recording Analysis</h3>

        <div>
          {uploadedFile ? (
            <span className="status-badge connected">
              <span className="sim-pulse-dot" />
              <span>FILE LOADED</span>
            </span>
          ) : (
            <span className="status-badge standby">
              <span className="standby-dot" />
              <span>READY FOR AUDIO</span>
            </span>
          )}
        </div>
      </div>

      <div
        className="upload-dropzone-box"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
        <div className="dropzone-icon-ring">
          <UploadCloud size={22} className="text-orange" />
        </div>
        <div className="dropzone-text-group">
          <h4 className="dropzone-heading">Drop audio recording here, or click to browse</h4>
          <p className="dropzone-sub">Supports .wav, .mp3, .m4a, .flac audio formats</p>
        </div>
      </div>

      <div className="benchmark-strip-container">
        <span className="benchmark-strip-label">Or select a test recording:</span>
        <div className="benchmark-buttons-row">
          <button
            className="benchmark-btn"
            onClick={() => onLoadSampleFile('clone')}
            type="button"
          >
            <AlertTriangle size={13} className="text-danger" />
            <span className="benchmark-btn-text">ElevenLabs_CEO_Clone.wav</span>
            <span className="benchmark-pill danger">AI Clone (98%)</span>
          </button>

          <button
            className="benchmark-btn"
            onClick={() => onLoadSampleFile('authentic')}
            type="button"
          >
            <CheckCircle2 size={13} className="text-safe" />
            <span className="benchmark-btn-text">Authentic_Executive.wav</span>
            <span className="benchmark-pill safe">Authentic Human</span>
          </button>
        </div>
      </div>

      {uploadedFile && customFileResult && (
        <div className="loaded-file-meta-card animate-fade-in">
          <div className="file-header-row">
            <div className="file-name-group">
              <FileAudio size={18} className="text-orange" />
              <div className="file-title-meta">
                <span className="file-name-title">{uploadedFile.name}</span>
                <span className="file-sub-meta mono-metric">
                  {customFileResult.duration} • {customFileResult.size} • {customFileResult.codec}
                </span>
              </div>
            </div>

            <div className="file-actions-bar">
              {!isStreaming ? (
                <button
                  id="inspect-file-btn"
                  className="btn-primary pulse-attention"
                  onClick={onStartStream}
                  type="button"
                >
                  <Play size={14} />
                  <span>Start Voice Inspection</span>
                </button>
              ) : (
                <button
                  id="stop-inspect-file-btn"
                  className="btn-danger"
                  onClick={onStopStream}
                  type="button"
                >
                  <Square size={14} />
                  <span>Stop Inspection</span>
                </button>
              )}

              <button
                id="clear-file-btn"
                className="btn-secondary"
                onClick={onClearFile}
                type="button"
                title="Remove loaded file"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
