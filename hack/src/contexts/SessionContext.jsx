import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useEditor } from './EditorContext';
import { useTheme } from './ThemeContext';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const { openTabs, activeTab, files } = useEditor();
  const { themeName, fontSize } = useTheme();

  const saveSession = useCallback(() => {
    try {
      // Strip large binary content from files before saving to localStorage
      const stripBinaryContent = (fileTree) => {
        if (!fileTree) return null;

        const stripped = {};
        for (const [key, node] of Object.entries(fileTree)) {
          if (node.type === 'file') {
            // Only save file structure, not large content or binary data
            const isLargeOrBinary =
              node.dataUrl ||
              node.url ||
              (node.content && node.content.length > 50000); // 50KB limit

            stripped[key] = {
              type: node.type,
              lang: node.lang,
              content: isLargeOrBinary ? '' : node.content, // Exclude large/binary content
            };
          } else if (node.type === 'folder') {
            stripped[key] = {
              type: node.type,
              children: stripBinaryContent(node.children),
            };
          }
        }
        return stripped;
      };

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
        files: stripBinaryContent(files),
      };

      localStorage.setItem('editor_session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
      // If still too large, save minimal session
      try {
        const minimalSession = {
          lastOpened: new Date().toISOString(),
          editor: {
            openTabs: [],
            activeTab: null,
          },
          theme: {
            name: themeName,
            fontSize,
          },
          files: null,
        };
        localStorage.setItem('editor_session', JSON.stringify(minimalSession));
      } catch (e) {
        console.error('Failed to save even minimal session:', e);
      }
    }
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
