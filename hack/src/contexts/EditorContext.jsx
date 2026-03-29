import React, { createContext, useContext, useState, useCallback } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [files, setFiles] = useState(null);

  // Multi-file selection for cross-file analysis
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);

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
    setOpenTabs((prev) => {
      if (!prev.includes(name)) {
        return [...prev, name];
      }
      return prev;
    });
    setActiveTab(name);
    setActiveFile(file);
  }, []);

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

  const toggleFileSelection = useCallback((fileName) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  }, []);

  const clearFileSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setMultiSelectMode(false);
  }, []);

  const getSelectedFileContents = useCallback(() => {
    if (!files || selectedFiles.size === 0) return [];
    const flat = flattenFiles(files);
    return Array.from(selectedFiles)
      .filter((name) => flat[name])
      .map((name) => ({ name, content: flat[name].content || '', lang: flat[name].lang }));
  }, [files, selectedFiles, flattenFiles]);

  const resetProject = useCallback(() => {
    setFiles(null);
    setOpenTabs([]);
    setActiveTab(null);
    setActiveFile(null);
    setSelectedFiles(new Set());
    setMultiSelectMode(false);
    localStorage.removeItem('editor_session');
  }, []);

  // Update file content
  const updateFileContent = useCallback((fileName, newContent) => {
    setFiles((prev) => {
      if (!prev) return prev;

      const updateInTree = (tree) => {
        const updated = {};
        for (const [key, node] of Object.entries(tree)) {
          if (node.type === 'file' && key === fileName) {
            updated[key] = { ...node, content: newContent };
          } else if (node.type === 'folder' && node.children) {
            updated[key] = { ...node, children: updateInTree(node.children) };
          } else {
            updated[key] = node;
          }
        }
        return updated;
      };

      return updateInTree(prev);
    });

    // Update active file if it's the one being edited
    if (activeTab === fileName) {
      setActiveFile((prev) => prev ? { ...prev, content: newContent } : prev);
    }
  }, [activeTab]);

  // Create new file
  const createFile = useCallback((folderPath, fileName, content = '') => {
    setFiles((prev) => {
      if (!prev) return prev;

      const navigate = (tree, path) => {
        if (!path || path === '/') return tree;
        const parts = path.split('/').filter(Boolean);
        let current = tree;

        for (const part of parts) {
          if (current[part] && current[part].type === 'folder') {
            current = current[part].children;
          }
        }
        return current;
      };

      const updated = JSON.parse(JSON.stringify(prev));
      const targetFolder = navigate(updated, folderPath);

      const ext = fileName.split('.').pop().toLowerCase();
      targetFolder[fileName] = {
        type: 'file',
        lang: ext,
        content,
      };

      return updated;
    });
  }, []);

  // Create new folder
  const createFolder = useCallback((parentPath, folderName) => {
    setFiles((prev) => {
      if (!prev) return prev;

      const navigate = (tree, path) => {
        if (!path || path === '/') return tree;
        const parts = path.split('/').filter(Boolean);
        let current = tree;

        for (const part of parts) {
          if (current[part] && current[part].type === 'folder') {
            current = current[part].children;
          }
        }
        return current;
      };

      const updated = JSON.parse(JSON.stringify(prev));
      const targetFolder = navigate(updated, parentPath);

      targetFolder[folderName] = {
        type: 'folder',
        children: {},
      };

      return updated;
    });
  }, []);

  // Delete file or folder
  const deleteItem = useCallback((path) => {
    const parts = path.split('/').filter(Boolean);
    const itemName = parts.pop();

    setFiles((prev) => {
      if (!prev) return prev;

      const navigate = (tree, pathParts) => {
        if (pathParts.length === 0) return tree;
        let current = tree;

        for (const part of pathParts) {
          if (current[part] && current[part].type === 'folder') {
            current = current[part].children;
          }
        }
        return current;
      };

      const updated = JSON.parse(JSON.stringify(prev));
      const parentFolder = navigate(updated, parts);

      delete parentFolder[itemName];

      return updated;
    });

    // Close tab if file was open
    if (openTabs.includes(itemName)) {
      closeTab(itemName);
    }
  }, [openTabs, closeTab]);

  // Rename file or folder
  const renameItem = useCallback((path, newName) => {
    const parts = path.split('/').filter(Boolean);
    const oldName = parts.pop();

    setFiles((prev) => {
      if (!prev) return prev;

      const navigate = (tree, pathParts) => {
        if (pathParts.length === 0) return tree;
        let current = tree;

        for (const part of pathParts) {
          if (current[part] && current[part].type === 'folder') {
            current = current[part].children;
          }
        }
        return current;
      };

      const updated = JSON.parse(JSON.stringify(prev));
      const parentFolder = navigate(updated, parts);

      parentFolder[newName] = parentFolder[oldName];
      delete parentFolder[oldName];

      // Update lang if file extension changed
      if (parentFolder[newName].type === 'file') {
        const ext = newName.split('.').pop().toLowerCase();
        parentFolder[newName].lang = ext;
      }

      return updated;
    });

    // Update tab name if file was open
    if (openTabs.includes(oldName)) {
      setOpenTabs((prev) => prev.map((t) => (t === oldName ? newName : t)));
      if (activeTab === oldName) {
        setActiveTab(newName);
      }
    }
  }, [openTabs, activeTab]);

  const value = {
    openTabs,
    activeTab,
    activeFile,
    files,
    openFile,
    closeTab,
    switchTab,
    loadFiles,
    resetProject,
    flattenFiles,
    updateFileContent,
    createFile,
    createFolder,
    deleteItem,
    renameItem,
    selectedFiles,
    multiSelectMode,
    setMultiSelectMode,
    toggleFileSelection,
    clearFileSelection,
    getSelectedFileContents,
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
