import React from 'react';
import { Palette, X, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '../../core/theme/ThemeContext';
import './ThemeCustomizerModal.css';

export function ThemeCustomizerModal({ isOpen, onClose }) {
  const { themeTokens, updateToken, resetTokens } = useTheme();

  if (!isOpen) return null;

  const colorFields = [
    { key: 'accentPrimary', label: 'Primary Brand / Persimmon', desc: 'Main interactive buttons, active tabs, waveform alerts' },
    { key: 'textMain', label: 'Typography / Light Peach', desc: 'Main text headings, values, and high-contrast labels' },
    { key: 'bgApp', label: 'App Background / Dark Brown', desc: 'Root background for the entire application' },
    { key: 'bgSurfaceSolid', label: 'Card Surface / Zinnwaldite', desc: 'Background for panels, cards, and navigation bars' },
    { key: 'accentKaraki', label: 'Deep Accent / Karaki', desc: 'Avatar backdrops, deep border insets, and subtle glows' }
  ];

  return (
    <div className="customizer-overlay" id="theme-customizer-overlay">
      <div className="customizer-box card">
        <div className="customizer-header">
          <div className="title-row">
            <Palette size={20} className="text-orange" />
            <div className="title-text">
              <h3 className="customizer-title">Central Theme Control Bus</h3>
              <span className="customizer-sub">Instantaneous Real-Time Color Processing</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="customizer-desc">
          Adjust any of the 5 core palette tokens below. Changes propagate centrally to all CSS variables, canvas visualizers, and SVG gradients immediately:
        </p>

        <div className="token-inputs-grid">
          {colorFields.map((field) => {
            const currentColor = themeTokens[field.key] || '#000000';
            return (
              <div key={field.key} className="token-row card-elevated">
                <div className="token-info">
                  <span className="token-label">{field.label}</span>
                  <span className="token-desc">{field.desc}</span>
                </div>

                <div className="color-picker-group">
                  <input
                    type="color"
                    className="native-color-picker"
                    value={currentColor.startsWith('#') ? currentColor : '#EA580C'}
                    onChange={(e) => updateToken(field.key, e.target.value)}
                  />
                  <input
                    type="text"
                    className="hex-text-input mono-metric"
                    value={currentColor}
                    onChange={(e) => updateToken(field.key, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="customizer-footer">
          <button className="btn-outline" onClick={resetTokens}>
            <RotateCcw size={15} />
            <span>Reset to Config Defaults</span>
          </button>

          <button className="btn-primary" onClick={onClose}>
            <Check size={15} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThemeCustomizerModal;
