import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME, DEFAULT_FONT_SIZE } from '../utils/constants';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem('editor_theme');
    return (saved && THEMES[saved]) ? saved : DEFAULT_THEME;
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('editor_fontSize');
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
  });

  useEffect(() => {
    localStorage.setItem('editor_theme', themeName);
  }, [themeName]);

  useEffect(() => {
    localStorage.setItem('editor_fontSize', fontSize.toString());
  }, [fontSize]);

  const theme = THEMES[themeName];

  const value = {
    themeName,
    setThemeName,
    fontSize,
    setFontSize,
    theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
