import React from 'react';
import { Terminal, FileAudio, Copy, Check } from 'lucide-react';
import './ForensicLogs.css';

export function ForensicAnalysisLogs({
  logs,
  logFilter,
  onFilterChange,
  copiedLogs,
  onCopyLogs,
  logsContainerRef,
  filename,
  fileMeta,
  chunkStatus
}) {
  const filteredLogs = logFilter === 'abnormal' 
    ? logs.filter((l) => l.isAbnormal) 
    : logs;

  return (
    <div className="call-analysis-logs-section" id="call-logs-panel">
      <div className="logs-section-header">
        <div className="logs-header-titles">
          <div className="logs-title-row">
            <Terminal size={17} className="text-orange" />
            <h4 className="logs-heading">Live Audio Stream & Forensic Inspection Logs</h4>
          </div>
          {filename && (
            <div className="logs-file-meta mono-metric">
              <span className="log-file-pill">
                <FileAudio size={12} />
                <span>{filename}</span>
              </span>
              {fileMeta && <span className="log-spec-pill">{fileMeta}</span>}
              {chunkStatus && <span className="log-chunk-counter">{chunkStatus}</span>}
            </div>
          )}
        </div>

        <div className="logs-header-controls">
          <div className="log-filter-tabs">
            <button
              className={`log-filter-btn ${logFilter === 'all' ? 'active' : ''}`}
              onClick={() => onFilterChange('all')}
            >
              All Events ({logs.length})
            </button>
            <button
              className={`log-filter-btn danger ${logFilter === 'abnormal' ? 'active' : ''}`}
              onClick={() => onFilterChange('abnormal')}
            >
              Abnormalities ({logs.filter((l) => l.isAbnormal).length})
            </button>
          </div>

          <button
            className="btn-copy-logs"
            onClick={onCopyLogs}
            title="Copy logs to clipboard"
          >
            {copiedLogs ? <Check size={13} className="text-safe" /> : <Copy size={13} />}
            <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="logs-terminal-viewport" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="logs-empty-state">
            <span>No log entries recorded yet in current filter.</span>
          </div>
        ) : (
          <div className="logs-entries-list">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`log-entry-row ${log.isAbnormal ? 'abnormal-highlight' : ''}`}
              >
                <span className="log-timestamp mono-metric">{log.timestamp}</span>
                <span className={`log-badge-level mono-metric ${log.level.toLowerCase()}`}>
                  [{log.level}]
                </span>
                <span className="log-badge-tag mono-metric">
                  [{log.tag}]
                </span>
                <span className={`log-message-body ${log.isAbnormal ? 'abnormal-text' : ''}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
