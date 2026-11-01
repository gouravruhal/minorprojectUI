import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, AlertTriangle, Play, Trash2 } from 'lucide-react';
import './ForensicAnalysisView.css';

export function AudioForensicIngress({
  uploadedFile,
  onFileSelect,
  onAnalyze,
  onClear,
  isAnalyzing,
  fileError
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="forensic-ingress-card card animate-fade-in">
      <div
        className={`forensic-dropzone ${isDragOver ? 'drag-active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.webm,.flac,.m4a"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <div className="dropzone-icon-bubble">
          <UploadCloud size={24} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700 }}>
          {isDragOver ? 'Release to Drop Voice Recording' : 'Upload Voice Recording for Forensic Inspection'}
        </h4>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Supports WAV, MP3, FLAC, M4A, and WebM (Max 25MB). System will slice into 5-second parts for deep acoustic analysis.
        </p>
      </div>

      {fileError && (
        <div className="error-alert-strip animate-fade-in">
          <AlertTriangle size={15} className="text-danger" />
          <span>{fileError}</span>
        </div>
      )}

      {uploadedFile && (
        <div className="file-meta-header-row animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="file-avatar-ring">
              <FileAudio size={18} style={{ color: 'var(--accent-green)' }} />
            </div>
            <div>
              <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.88rem' }}>{uploadedFile.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', fontFamily: 'monospace' }}>
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for 5s Chunk Inspection
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              type="button"
              disabled={isAnalyzing}
              onClick={onAnalyze}
            >
              <Play size={13} />
              <span>{isAnalyzing ? 'Inspecting Slices...' : 'Run Forensic Analysis'}</span>
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              type="button"
              onClick={onClear}
              title="Remove File"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
