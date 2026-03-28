import React, { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FileIcon } from '../Icons/FileIcon';
import { FolderIcon } from '../Icons/FolderIcon';
import { ChevronIcon } from '../Icons/ChevronIcon';

export function FileExplorer() {
  const { files, openFile, activeTab } = useEditor();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState({ src: true });

  const toggleFolder = (name) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderTree = (tree, depth = 0) => {
    if (!tree) return null;

    return Object.entries(tree).map(([name, node]) => {
      if (node.type === 'folder') {
        const isOpen = expanded[name];
        return (
          <div key={name}>
            <div
              onClick={() => toggleFolder(name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 8px',
                paddingLeft: 8 + depth * 16,
                cursor: 'pointer',
                color: theme.text,
                fontSize: 12.5,
                fontFamily: "'IBM Plex Mono', monospace",
                borderRadius: 4,
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronIcon open={isOpen} />
              <FolderIcon open={isOpen} />
              <span style={{ fontWeight: 500 }}>{name}</span>
            </div>
            {isOpen && (
              <div style={{ animation: 'slideDown 0.15s ease' }}>
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      const isActive = activeTab === name;
      return (
        <div
          key={name}
          onClick={() => openFile(name, node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            paddingLeft: 26 + depth * 16,
            cursor: 'pointer',
            color: isActive ? theme.accent : theme.text,
            background: isActive ? theme.accentDim : 'transparent',
            fontSize: 12.5,
            fontFamily: "'IBM Plex Mono', monospace",
            borderRadius: 4,
            transition: 'all 0.15s',
            borderLeft: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = theme.accentDim;
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = 'transparent';
          }}
        >
          <FileIcon lang={node.lang} />
          <span>{name}</span>
        </div>
      );
    });
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {files ? renderTree(files) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.textDim,
          fontSize: 12,
        }}>
          No files loaded
        </div>
      )}
    </div>
  );
}
