/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { THEME_PALETTES, applyTokensToDocument } from './theme.config';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('voiceshield_theme') || 'dark';
  });

  const [activePaletteId, setActivePaletteId] = useState(() => {
    return localStorage.getItem('voiceshield_palette') || 'karaki_persimmon';
  });

  const [customOverrides, setCustomOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('voiceshield_custom_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate merged active tokens centrally
  const themeTokens = useMemo(() => {
    const palette = THEME_PALETTES[activePaletteId] || THEME_PALETTES.karaki_persimmon;
    const baseTokens = palette[themeMode] || palette.dark;
    return {
      ...baseTokens,
      ...customOverrides
    };
  }, [activePaletteId, themeMode, customOverrides]);

  // Central Effect: Inject tokens directly into :root CSS custom properties
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('voiceshield_theme', themeMode);
    localStorage.setItem('voiceshield_palette', activePaletteId);
    applyTokensToDocument(themeTokens);
  }, [themeMode, activePaletteId, themeTokens]);

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setPalette = useCallback((paletteId) => {
    if (THEME_PALETTES[paletteId]) {
      setActivePaletteId(paletteId);
    }
  }, []);

  const updateToken = useCallback((tokenKey, value) => {
    setCustomOverrides(prev => {
      const next = { ...prev, [tokenKey]: value };
      localStorage.setItem('voiceshield_custom_overrides', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetTokens = useCallback(() => {
    setCustomOverrides({});
    localStorage.removeItem('voiceshield_custom_overrides');
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: themeMode,
        themeMode,
        activePaletteId,
        themeTokens,
        toggleTheme,
        setPalette,
        updateToken,
        resetTokens,
        availablePalettes: THEME_PALETTES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
