import React from 'react';
import { Cpu, CheckCircle2, Loader2, Sparkles, Sliders, Waves, Layers, Clock } from 'lucide-react';
import './ForensicAnalysisView.css';

const STAGES = [
  { id: 'ingest', label: '1. 16kHz Normalization', icon: Waves },
  { id: 'features', label: '2. 5s Glottal Extraction', icon: Sliders },
  { id: 'intervals', label: '3. Sequential Chunk Pass', icon: Layers },
  { id: 'classification', label: '4. Dual Ensemble ML', icon: Cpu },
  { id: 'llm_forensics', label: '5. LLM Timeline Forensics', icon: Sparkles }
];

export function ForensicPipelineTracker({ stage, progress, chunkState }) {
  const getStageStatus = (stageId) => {
    const stageOrder = ['ingest', 'features', 'intervals', 'classification', 'llm_forensics', 'complete'];
    const currIdx = stageOrder.indexOf(stage);
    const targetIdx = stageOrder.indexOf(stageId);
    if (stage === 'complete' || currIdx > targetIdx) return 'done';
    if (currIdx === targetIdx) return 'active';
    return 'pending';
  };

  const totalChunks = chunkState?.totalChunks || 1;
  const currentChunk = chunkState?.currentChunk || 1;
  const chunkList = Array.from({ length: totalChunks }, (_, i) => i + 1);

  return (
    <div className="pipeline-tracker-box card animate-fade-in">
      {/* 5-Second Sequential Chunk Execution Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
            Processing 5-Second Chunks One-by-One ({currentChunk} / {totalChunks})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {chunkState?.chunkRange && (
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--accent-blue)', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
              Active: [{chunkState.chunkRange}]
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-green)', fontSize: '0.9rem' }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Sequential 5-Second Chunk Tiles */}
      {totalChunks > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {chunkList.map((chunkNum) => {
            const isDone = chunkNum < currentChunk || stage === 'complete';
            const isActive = chunkNum === currentChunk && stage !== 'complete';
            const sTime = (chunkNum - 1) * 5;
            const eTime = chunkNum * 5;
            const label = `${String(Math.floor(sTime / 60)).padStart(2, '0')}:${String(sTime % 60).padStart(2, '0')}-${String(Math.floor(eTime / 60)).padStart(2, '0')}:${String(eTime % 60).padStart(2, '0')}`;

            return (
              <div
                key={chunkNum}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem',
                  borderRadius: 8, fontSize: '0.74rem', fontFamily: 'monospace',
                  background: isDone ? 'rgba(16, 185, 129, 0.12)' : (isActive ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-inset)'),
                  border: isDone ? '1px solid rgba(16, 185, 129, 0.35)' : (isActive ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-subtle)'),
                  color: isDone ? 'var(--accent-green)' : (isActive ? 'var(--accent-blue)' : 'var(--text-muted)'),
                  boxShadow: 'var(--shadow-clay)'
                }}
              >
                {isDone ? <CheckCircle2 size={12} /> : isActive ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                <span>5s Part {chunkNum} [{label}]</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Track */}
      <div style={{ height: 8, background: 'var(--bg-inset)', borderRadius: 4, margin: '0.85rem 0', overflow: 'hidden', boxShadow: 'var(--shadow-clay-inset)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green), var(--accent-yellow))', transition: 'width 0.3s ease' }} />
      </div>

      {/* Stage Tracker */}
      <div className="stages-grid">
        {STAGES.map((s) => {
          const status = getStageStatus(s.id);
          const Icon = s.icon;
          return (
            <div key={s.id} className={`stage-pill ${status}`}>
              {status === 'done' ? <CheckCircle2 size={13} className="text-safe" /> : status === 'active' ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--accent-blue)' }} /> : <Icon size={13} />}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
