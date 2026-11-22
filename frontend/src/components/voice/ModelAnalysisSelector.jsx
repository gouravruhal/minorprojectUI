import React from 'react';
import { Layers, Cpu, MessageSquareQuote, Check } from 'lucide-react';

export const MODEL_MODES = [
  {
    id: 'both',
    title: 'Dual-Model Multi-Layer Fusion',
    shortLabel: 'Both Models (Dual Fusion)',
    badge: 'Recommended',
    icon: Layers,
    desc: 'Fuses Deep ResNet Acoustic Model + DSP Prosody + Audio-Language Context LLM (50% Model + 20% DSP + 15% VIP + 15% Context).'
  },
  {
    id: 'acoustic_only',
    title: 'Voice Deepfake Model Only',
    shortLabel: 'Voice Acoustic Model',
    badge: 'Acoustic / DSP',
    icon: Cpu,
    desc: 'Evaluates neural vocoder phase artifacts, glottal jitter/shimmer micro-perturbations, and physical vocal tract geometry.'
  },
  {
    id: 'context_llm_only',
    title: 'Conversational Context LLM Only',
    shortLabel: 'Context Intent LLM',
    badge: 'Semantic / ASR',
    icon: MessageSquareQuote,
    desc: 'Transcribes spoken speech into text, extracts suspicious fraud phrases, and scores conversational social engineering urgency.'
  }
];

export function ModelAnalysisSelector({ selectedMode = 'both', onSelectMode, disabled = false }) {
  return (
    <div className="model-selector-card card clay-card animate-fade-in" id="model-analysis-selector">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Layers size={18} className="text-accent" />
          <h3 className="panel-heading">AI Engine Analysis Mode Configuration</h3>
        </div>
        <span className="badge badge-accent text-xs">
          Active: {MODEL_MODES.find((m) => m.id === selectedMode)?.shortLabel || 'Dual Fusion'}
        </span>
      </div>

      <div className="model-modes-grid">
        {MODEL_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              className={`model-mode-btn clay-inset ${isSelected ? 'active-mode' : ''}`}
              onClick={() => onSelectMode?.(mode.id)}
            >
              <div className="mode-btn-header">
                <div className="flex-center gap-2">
                  <div className={`mode-icon-box ${isSelected ? 'icon-active' : ''}`}>
                    <Icon size={16} />
                  </div>
                  <span className="mode-btn-title font-bold text-xs">{mode.shortLabel}</span>
                </div>
                {isSelected ? (
                  <span className="badge badge-safe text-xs flex-center gap-1">
                    <Check size={10} />
                    <span>Selected</span>
                  </span>
                ) : (
                  <span className="badge badge-neutral text-xs">{mode.badge}</span>
                )}
              </div>
              <p className="mode-btn-desc text-dim text-xs">{mode.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ModelAnalysisSelector;
