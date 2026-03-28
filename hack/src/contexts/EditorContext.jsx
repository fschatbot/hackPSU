import React, { createContext, useContext, useState, useCallback } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [files, setFiles] = useState(null);

  const flattenFiles = useCallback((fileTree) => {
    const flat = {};
    const walk = (tree) => {
      Object.entries(tree).forEach(([name, node]) => {
        if (node.type === 'file') {
          flat[name] = node;
        } else if (node.children) {
          walk(node.children);
        }
      });
    };
    walk(fileTree);
    return flat;
  }, []);

  const openFile = useCallback((name, file) => {
    if (!openTabs.includes(name)) {
      setOpenTabs((prev) => [...prev, name]);
    }
    setActiveTab(name);
    setActiveFile(file);
  }, [openTabs]);

  const closeTab = useCallback((name) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== name);
      if (activeTab === name && next.length > 0) {
        const newActive = next[next.length - 1];
        setActiveTab(newActive);
        const flatFiles = files ? flattenFiles(files) : {};
        setActiveFile(flatFiles[newActive] || null);
      } else if (next.length === 0) {
        setActiveTab(null);
        setActiveFile(null);
      }
      return next;
    });
  }, [activeTab, files, flattenFiles]);

  const switchTab = useCallback((name) => {
    setActiveTab(name);
    const flatFiles = files ? flattenFiles(files) : {};
    setActiveFile(flatFiles[name] || null);
  }, [files, flattenFiles]);

  const loadFiles = useCallback((fileTree) => {
    setFiles(fileTree);
    setOpenTabs([]);
    setActiveTab(null);
    setActiveFile(null);
  }, []);

  const value = {
    openTabs,
    activeTab,
    activeFile,
    files,
    openFile,
    closeTab,
    switchTab,
    loadFiles,
    flattenFiles,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
