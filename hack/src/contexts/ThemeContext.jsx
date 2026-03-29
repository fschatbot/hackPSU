import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME, DEFAULT_FONT_SIZE } from '../utils/constants';

const ThemeContext = createContext();

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem('editor_theme');
    return (saved && THEMES[saved]) ? saved : DEFAULT_THEME;
  });

  const [leftFontSize, setLeftFontSizeRaw] = useState(() => {
    const saved = localStorage.getItem('fontSize_left');
    return saved ? parseInt(saved, 10) : 12;
  });
  const [codeFontSize, setCodeFontSizeRaw] = useState(() => {
    const saved = localStorage.getItem('fontSize_code');
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
  });
  const [chatFontSize, setChatFontSizeRaw] = useState(() => {
    const saved = localStorage.getItem('fontSize_chat');
    return saved ? parseInt(saved, 10) : 13;
  });

  const setLeftFontSize  = (v) => setLeftFontSizeRaw(clamp(v, 10, 18));
  const setCodeFontSize  = (v) => setCodeFontSizeRaw(clamp(v, 10, 20));
  const setChatFontSize  = (v) => setChatFontSizeRaw(clamp(v, 10, 18));

  useEffect(() => { localStorage.setItem('editor_theme', themeName); }, [themeName]);
  useEffect(() => { localStorage.setItem('fontSize_left', leftFontSize.toString()); }, [leftFontSize]);
  useEffect(() => { localStorage.setItem('fontSize_code', codeFontSize.toString()); }, [codeFontSize]);
  useEffect(() => { localStorage.setItem('fontSize_chat', chatFontSize.toString()); }, [chatFontSize]);

  // Keep legacy key in sync so other code reading editor_fontSize still works
  useEffect(() => { localStorage.setItem('editor_fontSize', codeFontSize.toString()); }, [codeFontSize]);

  const theme = THEMES[themeName];

  const value = {
    themeName,
    setThemeName,
    // per-section font sizes
    leftFontSize,  setLeftFontSize,
    codeFontSize,  setCodeFontSize,
    chatFontSize,  setChatFontSize,
    // legacy alias so components that still import fontSize don't crash
    fontSize: codeFontSize,
    setFontSize: setCodeFontSize,
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
