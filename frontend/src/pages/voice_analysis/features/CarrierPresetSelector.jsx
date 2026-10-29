import React from 'react';
import { SIMULATION_PRESETS } from '../../../core/state/useCallSession';
import { Radio, AlertTriangle, ShieldCheck } from 'lucide-react';
import './CarrierPresetSelector.css';

export function CarrierPresetSelector({ activeCall, onSelectPreset }) {
  return (
    <div className="preset-scenarios-container card" id="preset-scenarios-dock">
      <div className="preset-scenarios-header">
        <div className="preset-kicker-row">
          <Radio size={14} className="text-orange" />
          <span className="preset-kicker-tag">Preset Telecom Scenarios</span>
        </div>
      </div>

      <div className="preset-cards-grid">
        {SIMULATION_PRESETS.map((preset) => {
          const isSelected = activeCall?.id === preset.id;
          const isCritical = preset.category === 'critical';

          return (
            <button
              key={preset.id}
              id={`preset-pill-${preset.id}`}
              type="button"
              className={`preset-scenario-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectPreset?.(preset)}
            >
              <div className="preset-card-top">
                <span className="preset-scenario-name">{preset.title.split(' (')[0]}</span>
                <span className={`preset-threat-pill ${isCritical ? 'danger' : 'safe'}`}>
                  {isCritical ? (
                    <>
                      <AlertTriangle size={11} />
                      <span>{preset.baseRisk}% RISK</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={11} />
                      <span>{preset.baseRisk}% RISK</span>
                    </>
                  )}
                </span>
              </div>

              <div className="preset-card-bottom">
                <span className="preset-caller-number mono-metric">{preset.callerNumber}</span>
                <span className="preset-network-pill">{preset.network.split(' (')[0]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
