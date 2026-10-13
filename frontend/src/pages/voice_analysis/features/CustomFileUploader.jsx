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
        <div className="upload-header-titles">
          <div className="ingress-kicker-row">
            <span className="ingress-kicker-tag">AUDIO FILE FORENSICS</span>
            <span className="badge badge-neutral">MULTIFORMAT DECODER</span>
          </div>
          <h3 className="upload-section-title">Forensic Call Recording Ingestion</h3>
          <p className="upload-section-desc">
            Upload intercepted audio files (.wav, .mp3, .m4a) for neural vocoder artifact detection and biometric validation.
          </p>
        </div>

        <div>
          {uploadedFile ? (
            <span className="status-badge connected">
              <span className="sim-pulse-dot" />
              <span>FILE LOADED & PARSED</span>
            </span>
          ) : (
            <span className="status-badge standby">
              <span className="standby-dot" />
              <span>AWAITING INPUT</span>
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
          <UploadCloud size={24} className="text-orange" />
        </div>
        <div className="dropzone-text-group">
          <h4 className="dropzone-heading">Drop call recording audio here, or click to browse</h4>
          <p className="dropzone-sub">Supports 16-bit / 24-bit PCM WAV, MP3, M4A, FLAC, OGG up to 50MB</p>
        </div>
      </div>

      <div className="benchmark-strip-container">
        <span className="benchmark-strip-label">Or load instant benchmark forensic test case:</span>
        <div className="benchmark-buttons-row">
          <button
            className="benchmark-btn"
            onClick={() => onLoadSampleFile('clone')}
          >
            <AlertTriangle size={14} className="text-danger" />
            <span className="benchmark-btn-text">ElevenLabs_CEO_Fraud.wav</span>
            <span className="benchmark-pill danger">AI Clone (98.4%)</span>
          </button>

          <button
            className="benchmark-btn"
            onClick={() => onLoadSampleFile('authentic')}
          >
            <CheckCircle2 size={14} className="text-safe" />
            <span className="benchmark-btn-text">Authentic_CFO_Call.wav</span>
            <span className="benchmark-pill safe">Genuine Human (99.1%)</span>
          </button>
        </div>
      </div>

      {uploadedFile && customFileResult && (
        <div className="loaded-file-meta-card animate-fade-in">
          <div className="file-header-row">
            <div className="file-name-group">
              <FileAudio size={20} className="text-orange" />
              <span className="file-name-title">{uploadedFile.name}</span>
            </div>
            <div className="file-actions-bar">
              {!isStreaming ? (
                <button
                  id="inspect-file-btn"
                  className="btn-primary pulse-attention"
                  onClick={onStartStream}
                >
                  <Play size={14} />
                  <span>Run Forensic Inspection</span>
                </button>
              ) : (
                <button
                  id="stop-inspect-file-btn"
                  className="btn-danger"
                  onClick={onStopStream}
                >
                  <Square size={14} />
                  <span>Stop Inspection</span>
                </button>
              )}

              <button
                id="clear-file-btn"
                className="btn-secondary"
                onClick={onClearFile}
                title="Remove loaded file"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="file-specs-grid">
            <div className="file-spec-item">
              <span className="file-spec-lbl">File Size</span>
              <span className="file-spec-val">{customFileResult.size}</span>
            </div>
            <div className="file-spec-item">
              <span className="file-spec-lbl">Audio Duration</span>
              <span className="file-spec-val">{customFileResult.duration}</span>
            </div>
            <div className="file-spec-item">
              <span className="file-spec-lbl">Sample Rate</span>
              <span className="file-spec-val">{customFileResult.sampleRate}</span>
            </div>
            <div className="file-spec-item">
              <span className="file-spec-lbl">Audio Codec</span>
              <span className="file-spec-val">{customFileResult.codec}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
