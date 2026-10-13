/**
 * ==============================================================================
 * CENTRAL THEME CONFIGURATION & CONTROL BUS (VoiceShield AI)
 * ==============================================================================
 * This is the SINGLE SOURCE OF TRUTH for all UI colors, theme modes, and tokens.
 * To make sudden changes to the UI across all components, canvas visualizers,
 * and CSS variables, simply update the values in this file!
 * ==============================================================================
 */

export const THEME_PALETTES = {
  // Primary Palette: Very Dark Brown, Zinnwaldite, Karaki, Persimmon, Light Peach
  karaki_persimmon: {
    id: 'karaki_persimmon',
    name: 'Karaki & Persimmon (Default)',
    colors: {
      darkBrown: '#0C0A09',   // Very Dark Brown
      zinnwaldite: '#1C1917', // Zinnwaldite Brown
      karaki: '#451A03',      // Karaki
      persimmon: '#EA580C',   // Persimmon
      lightPeach: '#FED7AA'   // Light Peach
    },
    dark: {
      // Backgrounds
      bgApp: '#0C0A09',
      bgSurface: 'rgba(28, 25, 23, 0.88)',
      bgSurfaceSolid: '#1C1917',
      bgElevated: 'rgba(69, 26, 3, 0.35)',
      bgInset: '#0C0A09',

      // Borders
      borderSubtle: 'rgba(254, 215, 170, 0.1)',
      borderKaraki: 'rgba(69, 26, 3, 0.8)',
      borderHover: 'rgba(234, 88, 12, 0.45)',
      borderActive: '#EA580C',

      // Typography
      textMain: '#FED7AA',
      textDim: '#E7E5E4',
      textMuted: '#A8A29E',
      textInverse: '#0C0A09',

      // Accents & Actions
      accentPrimary: '#EA580C',
      accentPrimaryHover: '#c2410c',
      accentPrimarySoft: 'rgba(234, 88, 12, 0.15)',
      accentPeach: '#FED7AA',
      accentKaraki: '#451A03',

      // Status Colors
      safeGreen: '#10B981',
      safeGreenSoft: 'rgba(16, 185, 129, 0.12)',
      safeGreenBorder: 'rgba(16, 185, 129, 0.3)',

      warnAmber: '#EA580C',
      warnAmberSoft: 'rgba(234, 88, 12, 0.12)',
      warnAmberBorder: 'rgba(234, 88, 12, 0.3)',

      dangerRed: '#EF4444',
      dangerRedSoft: 'rgba(239, 68, 68, 0.12)',
      dangerRedBorder: 'rgba(239, 68, 68, 0.35)',

      // Hardware Canvas Visualizer Colors
      waveformBaseline: 'rgba(168, 162, 158, 0.25)',
      waveformStroke: '#FED7AA',
      waveformAlert: '#EA580C',
      waveformShadow: 'rgba(234, 88, 12, 0.85)',
      spectrumPrimary: '#EA580C',
      spectrumSecondary: '#FED7AA',
      spectrumAlert: '#EF4444'
    },
    light: {
      // Backgrounds
      bgApp: '#FFF7ED',
      bgSurface: 'rgba(255, 255, 255, 0.92)',
      bgSurfaceSolid: '#FFFFFF',
      bgElevated: '#FED7AA',
      bgInset: '#FDBA74',

      // Borders
      borderSubtle: 'rgba(69, 26, 3, 0.12)',
      borderKaraki: 'rgba(69, 26, 3, 0.3)',
      borderHover: 'rgba(234, 88, 12, 0.5)',
      borderActive: '#EA580C',

      // Typography
      textMain: '#0C0A09',
      textDim: '#451A03',
      textMuted: '#78716C',
      textInverse: '#FFF7ED',

      // Accents & Actions
      accentPrimary: '#EA580C',
      accentPrimaryHover: '#c2410c',
      accentPrimarySoft: 'rgba(234, 88, 12, 0.1)',
      accentPeach: '#EA580C',
      accentKaraki: '#451A03',

      // Status Colors
      safeGreen: '#059669',
      safeGreenSoft: 'rgba(5, 150, 105, 0.1)',
      safeGreenBorder: 'rgba(5, 150, 105, 0.25)',

      warnAmber: '#EA580C',
      warnAmberSoft: 'rgba(234, 88, 12, 0.1)',
      warnAmberBorder: 'rgba(234, 88, 12, 0.25)',

      dangerRed: '#DC2626',
      dangerRedSoft: 'rgba(220, 38, 38, 0.1)',
      dangerRedBorder: 'rgba(220, 38, 38, 0.25)',

      // Hardware Canvas Visualizer Colors
      waveformBaseline: 'rgba(120, 113, 108, 0.25)',
      waveformStroke: '#EA580C',
      waveformAlert: '#DC2626',
      waveformShadow: 'rgba(234, 88, 12, 0.6)',
      spectrumPrimary: '#EA580C',
      spectrumSecondary: '#FED7AA',
      spectrumAlert: '#DC2626'
    }
  }
};

/**
 * Maps JS tokens directly to CSS custom properties on :root
 */
export function applyTokensToDocument(tokens) {
  const root = document.documentElement;

  root.style.setProperty('--bg-app', tokens.bgApp);
  root.style.setProperty('--bg-surface', tokens.bgSurface);
  root.style.setProperty('--bg-surface-solid', tokens.bgSurfaceSolid);
  root.style.setProperty('--bg-elevated', tokens.bgElevated);
  root.style.setProperty('--bg-inset', tokens.bgInset);

  root.style.setProperty('--border-subtle', tokens.borderSubtle);
  root.style.setProperty('--border-karaki', tokens.borderKaraki);
  root.style.setProperty('--border-hover', tokens.borderHover);
  root.style.setProperty('--border-active', tokens.borderActive);

  root.style.setProperty('--text-main', tokens.textMain);
  root.style.setProperty('--text-dim', tokens.textDim);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--text-inverse', tokens.textInverse);

  root.style.setProperty('--c-persimmon', tokens.accentPrimary);
  root.style.setProperty('--accent-orange', tokens.accentPrimary);
  root.style.setProperty('--accent-cyan', tokens.accentPrimary);
  root.style.setProperty('--accent-orange-hover', tokens.accentPrimaryHover);
  root.style.setProperty('--accent-orange-soft', tokens.accentPrimarySoft);
  root.style.setProperty('--accent-peach', tokens.accentPeach);
  root.style.setProperty('--c-light-peach', tokens.accentPeach);
  root.style.setProperty('--c-karaki', tokens.accentKaraki);

  root.style.setProperty('--safe-green', tokens.safeGreen);
  root.style.setProperty('--safe-green-soft', tokens.safeGreenSoft);
  root.style.setProperty('--safe-green-border', tokens.safeGreenBorder);

  root.style.setProperty('--warn-amber', tokens.warnAmber);
  root.style.setProperty('--warn-amber-soft', tokens.warnAmberSoft);
  root.style.setProperty('--warn-amber-border', tokens.warnAmberBorder);

  root.style.setProperty('--danger-red', tokens.dangerRed);
  root.style.setProperty('--danger-red-soft', tokens.dangerRedSoft);
  root.style.setProperty('--danger-red-border', tokens.dangerRedBorder);
}
