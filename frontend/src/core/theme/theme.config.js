/**
 * ==============================================================================
 * CENTRAL THEME CONFIGURATION & CONTROL BUS (VoiceShield AI) (<= 200 lines)
 * ==============================================================================
 * Single source of truth for UI colors, modes, and claymorphic tokens.
 * Premium Palette: Cobalt/Azure Blue, Emerald Green, and Cyber Yellow.
 * ==============================================================================
 */

export const THEME_PALETTES = {
  cyber_triad: {
    id: 'cyber_triad',
    name: 'Cyber Triad: Blue, Green & Gold',
    dark: {
      bgApp: '#0b0f17',
      bgSurface: '#131b2e',
      bgSurfaceSolid: '#131b2e',
      bgElevated: '#1a243d',
      bgInset: '#0c1322',

      borderSubtle: 'rgba(56, 189, 248, 0.16)',
      borderHover: '#38bdf8',
      borderActive: '#34d399',

      textMain: '#f8fafc',
      textDim: '#cbd5e1',
      textMuted: '#94a3b8',
      textInverse: '#0b0f17',

      accentBlue: '#38bdf8',
      accentGreen: '#34d399',
      accentYellow: '#facc15',
      accentPrimary: '#0284c7',
      accentPrimaryHover: '#0369a1',

      safeGreen: '#10b981',
      safeGreenSoft: 'rgba(16, 185, 129, 0.16)',
      warnAmber: '#facc15',
      warnAmberSoft: 'rgba(250, 204, 21, 0.16)',
      dangerRed: '#ef4444',
      dangerRedSoft: 'rgba(239, 68, 68, 0.16)',

      shadowClay: '10px 10px 26px rgba(0, 0, 0, 0.6), -8px -8px 24px rgba(255, 255, 255, 0.03), inset 1px 1px 2px rgba(255, 255, 255, 0.08)',
      shadowClayInset: 'inset 4px 4px 10px rgba(0, 0, 0, 0.65), inset -3px -3px 8px rgba(255, 255, 255, 0.03)',
      shadowClayBtn: '5px 5px 14px rgba(2, 132, 199, 0.45), inset 1px 1px 2px rgba(255, 255, 255, 0.3)',
      clayGradient: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)'
    },
    light: {
      bgApp: '#f0f3f8',
      bgSurface: '#ffffff',
      bgSurfaceSolid: '#ffffff',
      bgElevated: '#f8fafc',
      bgInset: '#e8edf5',

      borderSubtle: 'rgba(166, 175, 195, 0.45)',
      borderHover: '#0284c7',
      borderActive: '#059669',

      textMain: '#0f172a',
      textDim: '#334155',
      textMuted: '#64748b',
      textInverse: '#ffffff',

      accentBlue: '#0284c7',
      accentGreen: '#059669',
      accentYellow: '#d97706',
      accentPrimary: '#0284c7',
      accentPrimaryHover: '#0369a1',

      safeGreen: '#10b981',
      safeGreenSoft: 'rgba(16, 185, 129, 0.12)',
      warnAmber: '#d97706',
      warnAmberSoft: 'rgba(217, 119, 6, 0.12)',
      dangerRed: '#ef4444',
      dangerRedSoft: 'rgba(239, 68, 68, 0.12)',

      shadowClay: '10px 10px 24px rgba(166, 175, 195, 0.4), -10px -10px 24px #ffffff, inset 1px 1px 2px rgba(255, 255, 255, 0.95)',
      shadowClayInset: 'inset 4px 4px 8px rgba(166, 175, 195, 0.3), inset -4px -4px 8px #ffffff',
      shadowClayBtn: '5px 5px 14px rgba(2, 132, 199, 0.35), inset 1px 1px 2px rgba(255, 255, 255, 0.4)',
      clayGradient: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)'
    }
  }
};

// Default fallback alias
THEME_PALETTES.karaki_persimmon = THEME_PALETTES.cyber_triad;

export function applyTokensToDocument(tokens) {
  const root = document.documentElement;

  root.style.setProperty('--bg-app', tokens.bgApp);
  root.style.setProperty('--bg-surface', tokens.bgSurface);
  root.style.setProperty('--bg-surface-solid', tokens.bgSurfaceSolid);
  root.style.setProperty('--bg-elevated', tokens.bgElevated);
  root.style.setProperty('--bg-inset', tokens.bgInset);

  root.style.setProperty('--border-subtle', tokens.borderSubtle);
  root.style.setProperty('--border-hover', tokens.borderHover);
  root.style.setProperty('--border-active', tokens.borderActive);

  root.style.setProperty('--text-main', tokens.textMain);
  root.style.setProperty('--text-dim', tokens.textDim);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--text-inverse', tokens.textInverse);

  // Blue, Green, Yellow Premium Triad
  root.style.setProperty('--accent-blue', tokens.accentBlue);
  root.style.setProperty('--accent-green', tokens.accentGreen);
  root.style.setProperty('--accent-yellow', tokens.accentYellow);
  root.style.setProperty('--accent-primary', tokens.accentPrimary);
  root.style.setProperty('--accent-primary-hover', tokens.accentPrimaryHover);

  // Legacy compatibility mappings
  root.style.setProperty('--c-persimmon', tokens.accentBlue);
  root.style.setProperty('--accent-orange', tokens.accentBlue);
  root.style.setProperty('--accent-cyan', tokens.accentBlue);
  root.style.setProperty('--accent-peach', tokens.accentYellow);
  root.style.setProperty('--c-light-peach', tokens.accentGreen);
  root.style.setProperty('--c-karaki', tokens.accentGreen);

  // Status Colors
  root.style.setProperty('--safe-green', tokens.safeGreen);
  root.style.setProperty('--safe-green-soft', tokens.safeGreenSoft);
  root.style.setProperty('--warn-amber', tokens.warnAmber);
  root.style.setProperty('--warn-amber-soft', tokens.warnAmberSoft);
  root.style.setProperty('--danger-red', tokens.dangerRed);
  root.style.setProperty('--danger-red-soft', tokens.dangerRedSoft);

  // Dynamic Claymorphic Tokens
  root.style.setProperty('--shadow-clay', tokens.shadowClay);
  root.style.setProperty('--shadow-clay-inset', tokens.shadowClayInset);
  root.style.setProperty('--shadow-clay-btn', tokens.shadowClayBtn);
  root.style.setProperty('--clay-gradient', tokens.clayGradient);
}
