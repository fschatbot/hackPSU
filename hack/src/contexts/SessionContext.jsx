import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useEditor } from './EditorContext';
import { useTheme } from './ThemeContext';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const { openTabs, activeTab, files } = useEditor();
  const { themeName, fontSize } = useTheme();

  const saveSession = useCallback(() => {
    const session = {
      lastOpened: new Date().toISOString(),
      editor: {
        openTabs,
        activeTab,
      },
      theme: {
        name: themeName,
        fontSize,
      },
      files,
    };
    localStorage.setItem('editor_session', JSON.stringify(session));
  }, [openTabs, activeTab, themeName, fontSize, files]);

  const loadSession = useCallback(() => {
    const saved = localStorage.getItem('editor_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse session:', e);
        return null;
      }
    }
    return null;
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('editor_session');
  }, []);

  // Auto-save session every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (files) {
        saveSession();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [saveSession, files]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (files) {
        saveSession();
      }
    };
  }, [saveSession, files]);

  const value = {
    saveSession,
    loadSession,
    clearSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
